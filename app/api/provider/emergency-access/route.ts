import { type NextRequest, NextResponse } from 'next/server'
import { MEDICAL_DISCLAIMER } from '@/lib/ai/prompts'
import { logAccess } from '@/lib/supabase/queries/access-logs'
import { getEmergencyStaffByEmployeeId } from '@/lib/supabase/queries/employees'
import { getOrganizationBySlug } from '@/lib/supabase/queries/organizations'
import { getPatientById } from '@/lib/supabase/queries/patients'
import type { RecordCategory } from '@/lib/supabase/queries/records'
import { getPatientRecords } from '@/lib/supabase/queries/records'
import { getPatientSummary } from '@/lib/supabase/queries/summaries'
import { extractChartData } from '@/lib/utils/medical'

interface EmergencyAccessRequestBody {
  patientId: string
  employeeId: string
  organizationSlug: string
}

const FULL_SCOPE: RecordCategory[] = ['vitals', 'labs', 'meds', 'encounters']

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EmergencyAccessRequestBody
    const { patientId, employeeId, organizationSlug } = body

    // Validate required fields
    if (!patientId || !employeeId || !organizationSlug) {
      return NextResponse.json(
        { error: 'Patient ID, employee ID, and organization are required' },
        { status: 400 },
      )
    }

    // Validate organization exists and is active
    const organization = await getOrganizationBySlug(organizationSlug)
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found or inactive' },
        { status: 403 },
      )
    }

    // Validate employee is emergency staff
    const employee = await getEmergencyStaffByEmployeeId(
      employeeId,
      organization.id,
    )
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee is not designated as emergency staff' },
        { status: 403 },
      )
    }

    // Get patient
    const patient = await getPatientById(patientId)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Validate patient allows emergency access
    if (!patient.allowEmergencyAccess) {
      return NextResponse.json(
        { error: 'Patient has not enabled emergency access' },
        { status: 403 },
      )
    }

    // Log emergency access
    const ip =
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      'unknown'
    const userAgent = request.headers.get('user-agent') ?? undefined

    await logAccess({
      patientId: patient.id,
      providerName: employee.name,
      providerOrg: organization.name,
      ipAddress: ip,
      userAgent,
      accessMethod: 'emergency',
      scope: FULL_SCOPE,
      isEmergencyAccess: true,
    })

    // Fetch all records with full scope
    const records = await getPatientRecords(patient.id, {
      categories: FULL_SCOPE,
    })

    const summary = await getPatientSummary(patient.id)
    const chartData = extractChartData(records)

    return NextResponse.json({
      success: true,
      patientName: patient.name,
      dateOfBirth: patient.dateOfBirth,
      scope: FULL_SCOPE,
      records,
      summary: summary
        ? {
            clinicianSummary: summary.clinicianSummary,
            patientSummary: summary.patientSummary,
            anomalies: summary.anomalies,
          }
        : null,
      chartData,
      isEmergencyAccess: true,
      providerName: employee.name,
      providerOrg: organization.name,
      disclaimer: MEDICAL_DISCLAIMER,
    })
  } catch (error) {
    console.error('Emergency access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
