import { type NextRequest, NextResponse } from 'next/server'
import {
  getPatientById,
  updatePatientEmergencyAccess,
} from '@/lib/supabase/queries/patients'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({
      allowEmergencyAccess: patient.allowEmergencyAccess,
    })
  } catch (error) {
    console.error('Get patient settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

interface PatchRequestBody {
  allowEmergencyAccess?: boolean
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = (await request.json()) as PatchRequestBody

    // Validate request body
    if (typeof body.allowEmergencyAccess !== 'boolean') {
      return NextResponse.json(
        { error: 'allowEmergencyAccess must be a boolean' },
        { status: 400 },
      )
    }

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const updatedPatient = await updatePatientEmergencyAccess(
      id,
      body.allowEmergencyAccess,
    )

    if (!updatedPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      allowEmergencyAccess: updatedPatient.allowEmergencyAccess,
    })
  } catch (error) {
    console.error('Update patient settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
