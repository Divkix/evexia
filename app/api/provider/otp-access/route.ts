import { type NextRequest, NextResponse } from 'next/server'
import { MEDICAL_DISCLAIMER } from '@/lib/ai/prompts'
import { logAccess } from '@/lib/supabase/queries/access-logs'
import { getEmployeeByEmployeeIdAndOrg } from '@/lib/supabase/queries/employees'
import { getOrganizationBySlug } from '@/lib/supabase/queries/organizations'
import { getPatientById, maskEmail } from '@/lib/supabase/queries/patients'
import { getProviderByPatientAndEmployeeId } from '@/lib/supabase/queries/providers'
import {
  getPatientRecords,
  type RecordCategory,
} from '@/lib/supabase/queries/records'
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
      return handleRequestOtp(body)
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

async function handleRequestOtp(body: RequestOtpBody) {
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
  if (!provider) {
    return NextResponse.json(
      {
        error:
          'This provider is not authorized to access this patient. The patient must first add the provider to their authorized list.',
      },
      { status: 403 },
    )
  }

  // Send OTP to patient's email via Supabase
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: patient.email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    console.error('Failed to send OTP:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code to patient' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    maskedEmail: maskEmail(patient.email),
    scope: provider.scope,
    providerName: employee.name,
    providerOrg: organization.name,
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
  if (!provider) {
    return NextResponse.json(
      { error: 'Provider not authorized for this patient' },
      { status: 403 },
    )
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
      accessMethod: 'otp',
      scope: provider.scope,
    }),
    getPatientRecords(patient.id, {
      categories: provider.scope as RecordCategory[],
    }),
    getPatientSummary(patient.id),
  ])

  const chartData = extractChartData(records)

  return NextResponse.json({
    success: true,
    patientName: patient.name,
    dateOfBirth: patient.dateOfBirth,
    scope: provider.scope,
    records,
    summary: summary
      ? {
          clinicianSummary: summary.clinicianSummary,
          patientSummary: summary.patientSummary,
          anomalies: filterAnomaliesByScope(
            summary.anomalies as Anomaly[] | null,
            provider.scope,
          ),
          hasFullAccess: hasFullAccess(provider.scope),
          scopeWarning: hasFullAccess(provider.scope)
            ? null
            : 'This summary may reference data outside your authorized scope.',
        }
      : null,
    chartData,
    providerName: employee.name,
    providerOrg: organization.name,
    disclaimer: MEDICAL_DISCLAIMER,
  })
}
