import { type NextRequest, NextResponse } from 'next/server'
import { getPatientById } from '@/lib/supabase/queries/patients'
import {
  createShareToken,
  deleteToken,
  getPatientTokens,
  getTokenById,
  revokeToken,
} from '@/lib/supabase/queries/tokens'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const tokens = await getPatientTokens(id)

    return NextResponse.json({
      success: true,
      tokens,
    })
  } catch (error) {
    console.error('Get tokens error:', error)
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

    const { scope, expiryHours } = body

    if (!scope || !Array.isArray(scope) || scope.length === 0) {
      return NextResponse.json(
        { error: 'Scope is required and must be a non-empty array' },
        { status: 400 },
      )
    }

    const hours = expiryHours ?? 24
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)

    const token = await createShareToken({
      patientId: id,
      scope,
      expiresAt,
    })

    return NextResponse.json({
      success: true,
      token: token.token,
      scope: token.scope,
      expiresAt: token.expiresAt,
    })
  } catch (error) {
    console.error('Create token error:', error)
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
    const { tokenId, action } = body

    if (!tokenId || action !== 'revoke') {
      return NextResponse.json(
        { error: 'Token ID and action=revoke required' },
        { status: 400 },
      )
    }

    // Verify token belongs to this patient
    const existingToken = await getTokenById(tokenId)
    if (!existingToken || existingToken.patientId !== id) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    const token = await revokeToken(tokenId)

    return NextResponse.json({
      success: true,
      token,
    })
  } catch (error) {
    console.error('Revoke token error:', error)
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
    const tokenId = searchParams.get('tokenId')

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 },
      )
    }

    // Verify token belongs to this patient
    const existingToken = await getTokenById(tokenId)
    if (!existingToken || existingToken.patientId !== id) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    await deleteToken(tokenId)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Delete token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
