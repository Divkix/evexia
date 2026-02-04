import { type NextRequest, NextResponse } from 'next/server'
import { MEDICAL_DISCLAIMER } from '@/lib/ai/prompts'
import { logAccess } from '@/lib/supabase/queries/access-logs'
import { getEmployeeByEmployeeIdAndOrg } from '@/lib/supabase/queries/employees'
import { getOrganizationBySlug } from '@/lib/supabase/queries/organizations'
import { getPatientById } from '@/lib/supabase/queries/patients'
import type { RecordCategory } from '@/lib/supabase/queries/records'
import { getPatientRecords } from '@/lib/supabase/queries/records'
import {
  type Anomaly,
  filterAnomaliesByScope,
  getPatientSummary,
  hasFullAccess,
} from '@/lib/supabase/queries/summaries'
import { getValidShareToken } from '@/lib/supabase/queries/tokens'
import { extractChartData } from '@/lib/utils/medical'

interface AccessRequestBody {
  token: string
  employeeId: string
  organizationSlug: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AccessRequestBody
    const { token, employeeId, organizationSlug } = body

    if (!token || !employeeId || !organizationSlug) {
      return NextResponse.json(
        { error: 'Token, employee ID, and organization are required' },
        { status: 400 },
      )
    }

    // Validate organization
    const organization = await getOrganizationBySlug(organizationSlug)
    if (!organization) {
      return NextResponse.json(
        { error: 'Invalid organization' },
        { status: 403 },
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

    // Lookup employee by employeeId and organizationId
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
      providerOrg: organization.name,
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
            anomalies: filterAnomaliesByScope(
              summary.anomalies as Anomaly[] | null,
              shareToken.scope,
            ),
            hasFullAccess: hasFullAccess(shareToken.scope),
            scopeWarning: hasFullAccess(shareToken.scope)
              ? null
              : 'This summary may reference data outside your authorized scope.',
          }
        : null,
      chartData,
      providerName: employee.name,
      providerOrg: organization.name,
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
