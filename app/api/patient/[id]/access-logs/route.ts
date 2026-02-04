import { type NextRequest, NextResponse } from 'next/server'
import { getPatientAccessLogsWithTokens } from '@/lib/db/queries/access-logs'
import { getPatientById } from '@/lib/db/queries/patients'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const logs = await getPatientAccessLogsWithTokens(id)

    return NextResponse.json({
      success: true,
      logs,
    })
  } catch (error) {
    console.error('Get access logs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
