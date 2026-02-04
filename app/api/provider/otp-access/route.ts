import { type NextRequest, NextResponse } from 'next/server'
import { MEDICAL_DISCLAIMER } from '@/lib/ai/prompts'
import { logAccess } from '@/lib/db/queries/access-logs'
import {
  getPatientById,
  getPatientByNameAndDob,
  maskEmail,
} from '@/lib/db/queries/patients'
import {
  getProviderById,
  getProviderByPatientAndName,
} from '@/lib/db/queries/providers'
import type { RecordCategory } from '@/lib/db/queries/records'
import { getPatientRecords } from '@/lib/db/queries/records'
import { getPatientSummary } from '@/lib/db/queries/summaries'
import { createClient } from '@/lib/supabase/server'
import { extractChartData } from '@/lib/utils/medical'

interface OtpAccessRequestBody {
  action?: string
  patientName?: string
  dateOfBirth?: string
  providerName?: string
  providerOrg?: string
  patientId?: string
  providerId?: string
  code?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OtpAccessRequestBody
    const { action } = body

    if (action === 'request-otp') {
      return handleRequestOtp(request, body)
    }
    if (action === 'verify-otp') {
      return handleVerifyOtp(request, body)
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "request-otp" or "verify-otp"' },
      { status: 400 },
    )
  } catch (error) {
    console.error('Provider OTP access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

async function handleRequestOtp(
  _request: NextRequest,
  body: OtpAccessRequestBody,
) {
  const { patientName, dateOfBirth, providerName } = body

  if (!patientName || !dateOfBirth || !providerName) {
    return NextResponse.json(
      { error: 'Patient name, date of birth, and provider name are required' },
      { status: 400 },
    )
  }

  // Find patient
  const patient = await getPatientByNameAndDob(patientName, dateOfBirth)
  if (!patient) {
    return NextResponse.json(
      { error: 'No patient found with that name and date of birth' },
      { status: 404 },
    )
  }

  // Check if provider is authorized
  const provider = await getProviderByPatientAndName(patient.id, providerName)
  if (!provider) {
    return NextResponse.json(
      {
        error:
          'Provider not authorized for this patient. Patient must add you as a provider first.',
      },
      { status: 403 },
    )
  }

  // Send OTP to patient's email
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
    message:
      'Verification code sent to patient. Ask patient to share the code.',
    maskedEmail: maskEmail(patient.email),
    patientId: patient.id,
    providerId: provider.id,
    scope: provider.scope,
  })
}

async function handleVerifyOtp(
  request: NextRequest,
  body: OtpAccessRequestBody,
) {
  const { patientId, providerId, code, providerName, providerOrg } = body

  if (!patientId || !providerId || !code) {
    return NextResponse.json(
      { error: 'Patient ID, provider ID, and verification code are required' },
      { status: 400 },
    )
  }

  const patient = await getPatientById(patientId)
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  const provider = await getProviderById(providerId)
  if (!provider || provider.patientId !== patientId) {
    return NextResponse.json(
      { error: 'Provider not found or not authorized' },
      { status: 403 },
    )
  }

  // Verify OTP
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
    providerName,
    providerOrg,
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
    disclaimer: MEDICAL_DISCLAIMER,
  })
}
