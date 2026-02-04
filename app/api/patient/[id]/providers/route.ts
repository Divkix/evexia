import { type NextRequest, NextResponse } from 'next/server'
import { getPatientById } from '@/lib/supabase/queries/patients'
import {
  createProvider,
  deleteProvider,
  getPatientProviders,
  getProviderById,
  updateProvider,
} from '@/lib/supabase/queries/providers'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const providers = await getPatientProviders(id)

    return NextResponse.json({
      success: true,
      providers,
    })
  } catch (error) {
    console.error('Get providers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const { providerName, providerOrg, providerEmail, scope } = body

    if (!providerName) {
      return NextResponse.json(
        { error: 'Provider name is required' },
        { status: 400 },
      )
    }

    const provider = await createProvider({
      patientId: id,
      providerName,
      providerOrg,
      providerEmail,
      scope: scope ?? [],
    })

    return NextResponse.json({
      success: true,
      provider,
    })
  } catch (error) {
    console.error('Create provider error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { providerId, ...updates } = body

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 },
      )
    }

    const existingProvider = await getProviderById(providerId)
    if (!existingProvider || existingProvider.patientId !== id) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const provider = await updateProvider(providerId, updates)

    return NextResponse.json({
      success: true,
      provider,
    })
  } catch (error) {
    console.error('Update provider error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 },
      )
    }

    const existingProvider = await getProviderById(providerId)
    if (!existingProvider || existingProvider.patientId !== id) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    await deleteProvider(providerId)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Delete provider error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
