import { type NextRequest, NextResponse } from 'next/server'
import { generateSummary, MEDICAL_DISCLAIMER } from '@/lib/ai/summary'
import { getPatientById } from '@/lib/supabase/queries/patients'
import { getPatientRecords } from '@/lib/supabase/queries/records'
import {
  checkSummaryRateLimit,
  getPatientSummary,
  saveSummary,
} from '@/lib/supabase/queries/summaries'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const summary = await getPatientSummary(id)

    if (!summary) {
      return NextResponse.json({
        success: false,
        error: 'No summary generated yet',
      })
    }

    return NextResponse.json({
      success: true,
      clinicianSummary: summary.clinicianSummary,
      patientSummary: summary.patientSummary,
      anomalies: summary.anomalies,
      modelUsed: summary.modelUsed,
      disclaimer: MEDICAL_DISCLAIMER,
    })
  } catch (error) {
    console.error('Get summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Check rate limit before generating
    const rateLimit = await checkSummaryRateLimit(id)
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(rateLimit.retryAfterMs / 1000)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfterSeconds,
          message: `Please wait ${retryAfterSeconds} seconds before regenerating`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        },
      )
    }

    const records = await getPatientRecords(id)

    if (records.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No records found. Cannot generate summary.',
      })
    }

    const summaryResult = await generateSummary(records)
    await saveSummary(id, summaryResult.data)

    return NextResponse.json({
      success: true,
      usedFallback: summaryResult.usedFallback,
      fallbackReason: summaryResult.fallbackReason ?? null,
      clinicianSummary: summaryResult.data.clinicianSummary,
      patientSummary: summaryResult.data.patientSummary,
      anomalies: summaryResult.data.anomalies,
      modelUsed: summaryResult.data.modelUsed,
      disclaimer: MEDICAL_DISCLAIMER,
    })
  } catch (error) {
    console.error('Generate summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
