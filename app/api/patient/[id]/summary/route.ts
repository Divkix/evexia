import { type NextRequest, NextResponse } from 'next/server'
import { generateSummary, MEDICAL_DISCLAIMER } from '@/lib/ai/summary'
import { getPatientById } from '@/lib/db/queries/patients'
import { getPatientRecords } from '@/lib/db/queries/records'
import { getPatientSummary, saveSummary } from '@/lib/db/queries/summaries'

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

    const records = await getPatientRecords(id)

    if (records.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No records found. Cannot generate summary.',
      })
    }

    const summaryData = await generateSummary(records)
    await saveSummary(id, summaryData)

    return NextResponse.json({
      success: true,
      clinicianSummary: summaryData.clinicianSummary,
      patientSummary: summaryData.patientSummary,
      anomalies: summaryData.anomalies,
      modelUsed: summaryData.modelUsed,
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
