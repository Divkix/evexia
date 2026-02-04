import { NextResponse } from 'next/server'
import { getPatientByEmail, getPatientById } from '@/lib/db/queries/patients'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

// Demo patient ID for bypass mode - will be set by seed script
const DEMO_PATIENT_ID = process.env.DEMO_PATIENT_ID

export async function GET() {
  try {
    // Check for auth bypass in development
    if (env.dev.bypassAuth() && DEMO_PATIENT_ID) {
      const patient = await getPatientById(DEMO_PATIENT_ID)
      if (patient) {
        return NextResponse.json({
          authenticated: true,
          patient: {
            id: patient.id,
            name: patient.name,
            email: patient.email,
          },
          bypass: true,
        })
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        authenticated: false,
      })
    }

    // Find patient linked to this auth user
    const patient = user.email ? await getPatientByEmail(user.email) : null

    if (!patient) {
      return NextResponse.json({
        authenticated: true,
        patient: null,
      })
    }

    return NextResponse.json({
      authenticated: true,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
      },
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
