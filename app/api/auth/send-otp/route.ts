import { type NextRequest, NextResponse } from 'next/server'
import { isDemoPatient } from '@/lib/demo'
import {
  getPatientByNameAndDob,
  maskEmail,
} from '@/lib/supabase/queries/patients'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, dateOfBirth } = body

    if (!name || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Name and date of birth are required' },
        { status: 400 },
      )
    }

    // Find patient by name and DOB
    const patient = await getPatientByNameAndDob(name, dateOfBirth)

    if (!patient) {
      return NextResponse.json(
        { error: 'No patient found with that name and date of birth' },
        { status: 404 },
      )
    }

    // For demo patients: try to send real OTP, but don't fail on rate limit errors
    if (isDemoPatient(patient.email)) {
      const supabase = await createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: patient.email,
        options: {
          shouldCreateUser: true,
        },
      })
      if (error) {
        console.warn(
          'Demo patient OTP send failed (rate limit?), fallback active:',
          error.message,
        )
      }
      // Always return success for demo patients
      return NextResponse.json({
        success: true,
        maskedEmail: maskEmail(patient.email),
        patientId: patient.id,
      })
    }

    // Send OTP via Supabase
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: patient.email,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      console.error('Failed to send OTP:', error)
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      maskedEmail: maskEmail(patient.email),
      patientId: patient.id,
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
