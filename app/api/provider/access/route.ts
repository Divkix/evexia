import { type NextRequest, NextResponse } from 'next/server'
import { MEDICAL_DISCLAIMER } from '@/lib/ai/prompts'
import { logAccess } from '@/lib/db/queries/access-logs'
import { getPatientById } from '@/lib/db/queries/patients'
import type { RecordCategory } from '@/lib/db/queries/records'
import { getPatientRecords } from '@/lib/db/queries/records'
import { getPatientSummary } from '@/lib/db/queries/summaries'
import { getValidShareToken } from '@/lib/db/queries/tokens'
import { extractChartData } from '@/lib/utils/medical'

interface AccessRequestBody {
  token?: string
  patientName?: string
  dateOfBirth?: string
  providerName?: string
  providerOrg?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AccessRequestBody
    const { token, patientName, dateOfBirth, providerName, providerOrg } = body

    if (!token || !patientName || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Token, patient name, and date of birth are required' },
        { status: 400 },
      )
    }

    // Validate token
    const shareToken = await getValidShareToken(token)
    if (!shareToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 403 },
      )
    }

    // Verify patient identity
    const patient = await getPatientById(shareToken.patientId)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Check name and DOB match
    const normalizedName = patientName.trim().toLowerCase()
    const storedName = patient.name.trim().toLowerCase()

    if (normalizedName !== storedName) {
      return NextResponse.json(
        { error: 'Patient name does not match' },
        { status: 403 },
      )
    }

    if (patient.dateOfBirth !== dateOfBirth) {
      return NextResponse.json(
        { error: 'Date of birth does not match' },
        { status: 403 },
      )
    }

    // Log access (this is the bug fix - actually commits to DB)
    const ip =
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      'unknown'
    const userAgent = request.headers.get('user-agent') ?? undefined

    await logAccess({
      tokenId: shareToken.id,
      patientId: patient.id,
      providerName,
      providerOrg,
      ipAddress: ip,
      userAgent,
      accessMethod: 'token',
      scope: shareToken.scope,
    })

    // Get scoped records
    const records = await getPatientRecords(patient.id, {
      categories: shareToken.scope as RecordCategory[],
    })

    const summary = await getPatientSummary(patient.id)
    const chartData = extractChartData(records)

    return NextResponse.json({
      success: true,
      patientName: patient.name,
      dateOfBirth: patient.dateOfBirth,
      scope: shareToken.scope,
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
  } catch (error) {
    console.error('Provider access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
