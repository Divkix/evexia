import { type NextRequest, NextResponse } from 'next/server'
import { isDemoCode, isDemoPatient } from '@/lib/demo'
import { getPatientById, updatePatient } from '@/lib/supabase/queries/patients'
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

    // Demo code bypass for demo patients
    if (isDemoCode(code) && isDemoPatient(patient.email)) {
      const response = NextResponse.json({
        success: true,
        patientId: patient.id,
      })
      response.cookies.set('demo_patient_id', patient.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 2, // 2 hours - enough for demo
      })
      return response
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
