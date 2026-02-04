import { type NextRequest, NextResponse } from 'next/server'
import { getPatientById, updatePatient } from '@/lib/db/queries/patients'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, code } = body

    if (!patientId || !code) {
      return NextResponse.json(
        { error: 'Patient ID and verification code are required' },
        { status: 400 },
      )
    }

    const patient = await getPatientById(patientId)

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email: patient.email,
      token: code,
      type: 'email',
    })

    if (error) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 },
      )
    }

    // Link auth user to patient if not already linked
    if (data.user && !patient.authUserId) {
      await updatePatient(patient.id, { authUserId: data.user.id })
    }

    return NextResponse.json({
      success: true,
      patientId: patient.id,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
