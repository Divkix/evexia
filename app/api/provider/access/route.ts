import { type NextRequest, NextResponse } from 'next/server'
import { MEDICAL_DISCLAIMER } from '@/lib/ai/prompts'
import { logAccess } from '@/lib/supabase/queries/access-logs'
import { getEmployeeByEmployeeIdAndOrg } from '@/lib/supabase/queries/employees'
import { getOrganizationBySlug } from '@/lib/supabase/queries/organizations'
import { getPatientById } from '@/lib/supabase/queries/patients'
import type { RecordCategory } from '@/lib/supabase/queries/records'
import { getPatientRecords } from '@/lib/supabase/queries/records'
import {
  filterAnomaliesByScope,
  getPatientSummary,
  hasFullAccess,
  parseSummaryAnomalies,
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

    // Batch 1: Validate organization and token in parallel (independent)
    const [organization, shareToken] = await Promise.all([
      getOrganizationBySlug(organizationSlug),
      getValidShareToken(token),
    ])

    if (!organization) {
      return NextResponse.json(
        { error: 'Invalid organization' },
        { status: 403 },
      )
    }

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 403 },
      )
    }

    // Batch 2: Employee lookup (needs org.id) and patient lookup (needs shareToken.patientId) in parallel
    const [employee, patient] = await Promise.all([
      getEmployeeByEmployeeIdAndOrg(employeeId, organization.id),
      getPatientById(shareToken.patientId),
    ])

    if (!employee) {
      return NextResponse.json(
        { error: 'Invalid employee ID for this organization' },
        { status: 403 },
      )
    }

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Extract request metadata for logging
    const ip =
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      'unknown'
    const userAgent = request.headers.get('user-agent') ?? undefined

    // Batch 3: Log access, fetch records, and fetch summary in parallel
    const [, records, summary] = await Promise.all([
      logAccess({
        tokenId: shareToken.id,
        patientId: patient.id,
        providerName: employee.name,
        providerOrg: organization.name,
        ipAddress: ip,
        userAgent,
        accessMethod: 'employee_id',
        scope: shareToken.scope,
      }),
      getPatientRecords(patient.id, {
        categories: shareToken.scope as RecordCategory[],
      }),
      getPatientSummary(patient.id),
    ])

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
              parseSummaryAnomalies(summary.anomalies),
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
