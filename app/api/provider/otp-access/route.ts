import { type NextRequest, NextResponse } from 'next/server'
import { MEDICAL_DISCLAIMER } from '@/lib/ai/prompts'
import { isDemoCode, isDemoPatient } from '@/lib/demo'
import { logAccess } from '@/lib/supabase/queries/access-logs'
import { getEmployeeByEmployeeIdAndOrg } from '@/lib/supabase/queries/employees'
import { getOrganizationBySlug } from '@/lib/supabase/queries/organizations'
import { getPatientById, maskEmail } from '@/lib/supabase/queries/patients'
import { getProviderByPatientAndEmployeeId } from '@/lib/supabase/queries/providers'
import {
  getPatientRecords,
  type RecordCategory,
} from '@/lib/supabase/queries/records'

const FULL_SCOPE: RecordCategory[] = ['vitals', 'labs', 'meds', 'encounters']

import {
  type Anomaly,
  filterAnomaliesByScope,
  getPatientSummary,
  hasFullAccess,
} from '@/lib/supabase/queries/summaries'
import { createClient } from '@/lib/supabase/server'
import { extractChartData } from '@/lib/utils/medical'

interface RequestOtpBody {
  action: 'request-otp'
  patientId: string
  employeeId: string
  organizationSlug: string
}

interface VerifyOtpBody {
  action: 'verify-otp'
  patientId: string
  employeeId: string
  organizationSlug: string
  code: string
}

type OtpRequestBody = RequestOtpBody | VerifyOtpBody

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OtpRequestBody

    if (body.action === 'request-otp') {
      return handleRequestOtp(request, body)
    }

    if (body.action === 'verify-otp') {
      return handleVerifyOtp(request, body)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('OTP access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

async function handleRequestOtp(request: NextRequest, body: RequestOtpBody) {
  const { patientId, employeeId, organizationSlug } = body

  if (!patientId || !employeeId || !organizationSlug) {
    return NextResponse.json(
      { error: 'Patient ID, employee ID, and organization are required' },
      { status: 400 },
    )
  }

  // Batch 1: Organization and patient lookups are independent
  const [organization, patient] = await Promise.all([
    getOrganizationBySlug(organizationSlug),
    getPatientById(patientId),
  ])

  if (!organization) {
    return NextResponse.json({ error: 'Invalid organization' }, { status: 403 })
  }

  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  // Employee lookup depends on organization.id
  const employee = await getEmployeeByEmployeeIdAndOrg(
    employeeId,
    organization.id,
  )
  if (!employee) {
    return NextResponse.json(
      { error: 'Invalid employee ID for this organization' },
      { status: 403 },
    )
  }

  // Provider lookup depends on employee.id
  const provider = await getProviderByPatientAndEmployeeId(
    patientId,
    employee.id,
  )

  // Check for emergency access if no explicit provider relationship
  const isEmergencyAccess =
    !provider && employee.isEmergencyStaff && patient.allowEmergencyAccess

  if (!provider && !isEmergencyAccess) {
    return NextResponse.json(
      {
        error:
          'This provider is not authorized to access this patient. The patient must first add the provider to their authorized list.',
      },
      { status: 403 },
    )
  }

  // Determine scope based on access type
  const scope = isEmergencyAccess ? FULL_SCOPE : provider!.scope

  // If emergency access, bypass OTP and return data immediately
  if (isEmergencyAccess) {
    const ip =
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      'unknown'
    const userAgent = request.headers.get('user-agent') ?? undefined

    const [, records, summary] = await Promise.all([
      logAccess({
        patientId: patient.id,
        providerName: employee.name,
        providerOrg: organization.name,
        ipAddress: ip,
        userAgent,
        accessMethod: 'emergency',
        scope: FULL_SCOPE,
        isEmergencyAccess: true,
      }),
      getPatientRecords(patient.id, { categories: FULL_SCOPE }),
      getPatientSummary(patient.id),
    ])

    const chartData = extractChartData(records)

    return NextResponse.json({
      success: true,
      patientName: patient.name,
      dateOfBirth: patient.dateOfBirth,
      scope: FULL_SCOPE,
      records,
      summary: summary
        ? {
            clinicianSummary: summary.clinicianSummary,
            patientSummary: summary.patientSummary,
            anomalies: filterAnomaliesByScope(
              summary.anomalies as Anomaly[] | null,
              FULL_SCOPE,
            ),
            hasFullAccess: true,
            scopeWarning: null,
          }
        : null,
      chartData,
      providerName: employee.name,
      providerOrg: organization.name,
      isEmergencyAccess: true,
      disclaimer: MEDICAL_DISCLAIMER,
    })
  }

  // Send OTP to patient's email via Supabase
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: patient.email,
    options: {
      shouldCreateUser: false,
    },
  })

  // For demo patients: don't fail on rate limit errors
  if (error) {
    if (isDemoPatient(patient.email)) {
      console.warn(
        'Demo patient OTP send failed (rate limit?), fallback active:',
        error.message,
      )
    } else {
      console.error('Failed to send OTP:', error)
      return NextResponse.json(
        { error: 'Failed to send verification code to patient' },
        { status: 500 },
      )
    }
  }

  return NextResponse.json({
    success: true,
    maskedEmail: maskEmail(patient.email),
    scope,
    providerName: employee.name,
    providerOrg: organization.name,
    isEmergencyAccess,
  })
}

async function handleVerifyOtp(request: NextRequest, body: VerifyOtpBody) {
  const { patientId, employeeId, organizationSlug, code } = body

  if (!patientId || !employeeId || !organizationSlug || !code) {
    return NextResponse.json(
      {
        error:
          'Patient ID, employee ID, organization, and verification code are required',
      },
      { status: 400 },
    )
  }

  // Batch 1: Organization and patient lookups are independent
  const [organization, patient] = await Promise.all([
    getOrganizationBySlug(organizationSlug),
    getPatientById(patientId),
  ])

  if (!organization) {
    return NextResponse.json({ error: 'Invalid organization' }, { status: 403 })
  }

  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  // Employee lookup depends on organization.id
  const employee = await getEmployeeByEmployeeIdAndOrg(
    employeeId,
    organization.id,
  )
  if (!employee) {
    return NextResponse.json(
      { error: 'Invalid employee ID for this organization' },
      { status: 403 },
    )
  }

  // Provider lookup depends on employee.id
  const provider = await getProviderByPatientAndEmployeeId(
    patientId,
    employee.id,
  )

  // Check for emergency access if no explicit provider relationship
  const isEmergencyAccess =
    !provider && employee.isEmergencyStaff && patient.allowEmergencyAccess

  if (!provider && !isEmergencyAccess) {
    return NextResponse.json(
      { error: 'Provider not authorized for this patient' },
      { status: 403 },
    )
  }

  // Determine scope based on access type
  const scope = isEmergencyAccess ? FULL_SCOPE : provider!.scope

  // Demo code bypass for demo patients
  if (isDemoCode(code) && isDemoPatient(patient.email)) {
    // Skip Supabase verification, continue with access logging and data retrieval
    // Extract request metadata for logging
    const ip =
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      'unknown'
    const userAgent = request.headers.get('user-agent') ?? undefined

    // Batch 2: Log access, fetch records, and fetch summary in parallel
    const [, records, summary] = await Promise.all([
      logAccess({
        patientId: patient.id,
        providerName: employee.name,
        providerOrg: organization.name,
        ipAddress: ip,
        userAgent,
        accessMethod: isEmergencyAccess ? 'emergency' : 'otp',
        scope,
        isEmergencyAccess,
      }),
      getPatientRecords(patient.id, {
        categories: scope as RecordCategory[],
      }),
      getPatientSummary(patient.id),
    ])

    const chartData = extractChartData(records)

    return NextResponse.json({
      success: true,
      patientName: patient.name,
      dateOfBirth: patient.dateOfBirth,
      scope,
      records,
      summary: summary
        ? {
            clinicianSummary: summary.clinicianSummary,
            patientSummary: summary.patientSummary,
            anomalies: filterAnomaliesByScope(
              summary.anomalies as Anomaly[] | null,
              scope,
            ),
            hasFullAccess: hasFullAccess(scope),
            scopeWarning: hasFullAccess(scope)
              ? null
              : 'This summary may reference data outside your authorized scope.',
          }
        : null,
      chartData,
      providerName: employee.name,
      providerOrg: organization.name,
      isEmergencyAccess,
      disclaimer: MEDICAL_DISCLAIMER,
    })
  }

  // Verify OTP with Supabase (depends on patient.email)
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    email: patient.email,
    token: code,
    type: 'email',
  })

  if (error) {
    return NextResponse.json(
      { error: 'Invalid or expired verification code' },
      { status: 400 },
    )
  }

  // Extract request metadata for logging
  const ip =
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    'unknown'
  const userAgent = request.headers.get('user-agent') ?? undefined

  // Batch 2: Log access, fetch records, and fetch summary in parallel
  const [, records, summary] = await Promise.all([
    logAccess({
      patientId: patient.id,
      providerName: employee.name,
      providerOrg: organization.name,
      ipAddress: ip,
      userAgent,
      accessMethod: isEmergencyAccess ? 'emergency' : 'otp',
      scope,
      isEmergencyAccess,
    }),
    getPatientRecords(patient.id, {
      categories: scope as RecordCategory[],
    }),
    getPatientSummary(patient.id),
  ])

  const chartData = extractChartData(records)

  return NextResponse.json({
    success: true,
    patientName: patient.name,
    dateOfBirth: patient.dateOfBirth,
    scope,
    records,
    summary: summary
      ? {
          clinicianSummary: summary.clinicianSummary,
          patientSummary: summary.patientSummary,
          anomalies: filterAnomaliesByScope(
            summary.anomalies as Anomaly[] | null,
            scope,
          ),
          hasFullAccess: hasFullAccess(scope),
          scopeWarning: hasFullAccess(scope)
            ? null
            : 'This summary may reference data outside your authorized scope.',
        }
      : null,
    chartData,
    providerName: employee.name,
    providerOrg: organization.name,
    isEmergencyAccess,
    disclaimer: MEDICAL_DISCLAIMER,
  })
}
