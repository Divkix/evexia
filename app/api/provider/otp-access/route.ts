import { type NextRequest, NextResponse } from 'next/server'
import { MEDICAL_DISCLAIMER } from '@/lib/ai/prompts'
import { logAccess } from '@/lib/supabase/queries/access-logs'
import { getEmployeeByEmployeeId } from '@/lib/supabase/queries/employees'
import { getPatientById, maskEmail } from '@/lib/supabase/queries/patients'
import { getProviderByPatientAndEmployeeId } from '@/lib/supabase/queries/providers'
import {
  getPatientRecords,
  type RecordCategory,
} from '@/lib/supabase/queries/records'
import { getPatientSummary } from '@/lib/supabase/queries/summaries'
import { createClient } from '@/lib/supabase/server'
import { extractChartData } from '@/lib/utils/medical'

interface RequestOtpBody {
  action: 'request-otp'
  patientId: string
  employeeId: string
}

interface VerifyOtpBody {
  action: 'verify-otp'
  patientId: string
  employeeId: string
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
  const { patientId, employeeId } = body

  if (!patientId || !employeeId) {
    return NextResponse.json(
      { error: 'Patient ID and employee ID are required' },
      { status: 400 },
    )
  }

  // Lookup employee
  const employee = await getEmployeeByEmployeeId(employeeId)
  if (!employee) {
    return NextResponse.json({ error: 'Invalid employee ID' }, { status: 403 })
  }

  // Find patient
  const patient = await getPatientById(patientId)
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  // Check if employee is an authorized provider for this patient
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
    providerOrg: employee.organization,
  })
}

async function handleVerifyOtp(request: NextRequest, body: VerifyOtpBody) {
  const { patientId, employeeId, code } = body

  if (!patientId || !employeeId || !code) {
    return NextResponse.json(
      { error: 'Patient ID, employee ID, and verification code are required' },
      { status: 400 },
    )
  }

  // Lookup employee
  const employee = await getEmployeeByEmployeeId(employeeId)
  if (!employee) {
    return NextResponse.json({ error: 'Invalid employee ID' }, { status: 403 })
  }

  // Find patient
  const patient = await getPatientById(patientId)
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  // Check provider authorization
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

  // Verify OTP with Supabase
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

  // Log access
  const ip =
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    'unknown'
  const userAgent = request.headers.get('user-agent') ?? undefined

  await logAccess({
    patientId: patient.id,
    providerName: employee.name,
    providerOrg: employee.organization,
    ipAddress: ip,
    userAgent,
    accessMethod: 'otp',
    scope: provider.scope,
  })

  // Get scoped records
  const records = await getPatientRecords(patient.id, {
    categories: provider.scope as RecordCategory[],
  })

  const summary = await getPatientSummary(patient.id)
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
          anomalies: summary.anomalies,
        }
      : null,
    chartData,
    providerName: employee.name,
    providerOrg: employee.organization,
    disclaimer: MEDICAL_DISCLAIMER,
  })
}
