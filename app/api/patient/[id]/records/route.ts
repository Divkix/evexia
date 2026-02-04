import { type NextRequest, NextResponse } from 'next/server'
import { getPatientById } from '@/lib/db/queries/patients'
import {
  getPatientRecords,
  type RecordCategory,
} from '@/lib/db/queries/records'
import { extractChartData } from '@/lib/utils/medical'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const categoriesParam = searchParams.get('categories')

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const categories = categoriesParam
      ? (categoriesParam.split(',') as RecordCategory[])
      : undefined

    const records = await getPatientRecords(id, { categories })
    const chartData = extractChartData(records)

    return NextResponse.json({
      patient: {
        id: patient.id,
        name: patient.name,
        dateOfBirth: patient.dateOfBirth,
      },
      records,
      chartData,
    })
  } catch (error) {
    console.error('Get records error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
