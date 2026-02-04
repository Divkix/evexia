import { type NextRequest, NextResponse } from 'next/server'
import { isDemoPatient } from '@/lib/demo'
import { env } from '@/lib/env'
import {
  getPatientByEmail,
  getPatientById,
} from '@/lib/supabase/queries/patients'
import { createClient } from '@/lib/supabase/server'

// Demo patient ID for bypass mode - will be set by seed script
const DEMO_PATIENT_ID = process.env.DEMO_PATIENT_ID

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Auth bypass is ONLY allowed in development
    // Explicit NODE_ENV check as defense-in-depth against env.dev.bypassAuth() bugs
    const isProduction = process.env.NODE_ENV === 'production'
    if (!isProduction && env.dev.bypassAuth() && DEMO_PATIENT_ID) {
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

    // Demo session cookie check (for demo patients using 12345678 code)
    const demoPatientId = request.cookies.get('demo_patient_id')?.value
    if (demoPatientId) {
      const patient = await getPatientById(demoPatientId)
      if (patient && isDemoPatient(patient.email)) {
        return NextResponse.json({
          authenticated: true,
          patient: {
            id: patient.id,
            name: patient.name,
            email: patient.email,
          },
          demoMode: true,
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
