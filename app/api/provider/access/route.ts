import { type NextRequest, NextResponse } from 'next/server'
import { MEDICAL_DISCLAIMER } from '@/lib/ai/prompts'
import { logAccess } from '@/lib/db/queries/access-logs'
import { getEmployeeByEmployeeId } from '@/lib/db/queries/employees'
import { getPatientById } from '@/lib/db/queries/patients'
import type { RecordCategory } from '@/lib/db/queries/records'
import { getPatientRecords } from '@/lib/db/queries/records'
import { getPatientSummary } from '@/lib/db/queries/summaries'
import { getValidShareToken } from '@/lib/db/queries/tokens'
import { extractChartData } from '@/lib/utils/medical'

interface AccessRequestBody {
  token: string
  employeeId: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AccessRequestBody
    const { token, employeeId } = body

    if (!token || !employeeId) {
      return NextResponse.json(
        { error: 'Token and employee ID are required' },
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

    // Lookup employee by employeeId
    const employee = await getEmployeeByEmployeeId(employeeId)
    if (!employee) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 403 },
      )
    }

    // Get patient from token
    const patient = await getPatientById(shareToken.patientId)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Log access with employee info
    const ip =
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      'unknown'
    const userAgent = request.headers.get('user-agent') ?? undefined

    await logAccess({
      tokenId: shareToken.id,
      patientId: patient.id,
      providerName: employee.name,
      providerOrg: employee.organization,
      ipAddress: ip,
      userAgent,
      accessMethod: 'employee_id',
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
      providerName: employee.name,
      providerOrg: employee.organization,
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
