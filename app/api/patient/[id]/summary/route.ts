import { type NextRequest, NextResponse } from 'next/server'
import { generateSummary, MEDICAL_DISCLAIMER } from '@/lib/ai/summary'
import { getPatientById } from '@/lib/supabase/queries/patients'
import { getPatientRecords } from '@/lib/supabase/queries/records'
import {
  getPatientSummary,
  parseEquityConcerns,
  parsePredictions,
  parseSummaryAnomalies,
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
      return NextResponse.json(
        { error: 'No summary generated yet' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      clinicianSummary: summary.clinicianSummary,
      patientSummary: summary.patientSummary,
      anomalies: parseSummaryAnomalies(summary.anomalies),
      equityConcerns: parseEquityConcerns(summary.equityConcerns),
      predictions: parsePredictions(summary.predictions),
      modelUsed: summary.modelUsed,
      createdAt: summary.createdAt,
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

    const records = await getPatientRecords(id)

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No records found. Cannot generate summary.' },
        { status: 422 },
      )
    }

    const summaryResult = await generateSummary(records)
    const savedSummary = await saveSummary(id, summaryResult.data)

    return NextResponse.json({
      success: true,
      usedFallback: summaryResult.usedFallback,
      fallbackReason: summaryResult.fallbackReason ?? null,
      clinicianSummary: summaryResult.data.clinicianSummary,
      patientSummary: summaryResult.data.patientSummary,
      anomalies: summaryResult.data.anomalies,
      equityConcerns: summaryResult.data.equityConcerns,
      predictions: summaryResult.data.predictions,
      modelUsed: summaryResult.data.modelUsed,
      createdAt: savedSummary.createdAt,
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
