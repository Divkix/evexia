import { NextResponse } from 'next/server'
import { getAllOrganizations } from '@/lib/supabase/queries/organizations'

export async function GET() {
  try {
    const organizations = await getAllOrganizations()

    return NextResponse.json({
      success: true,
      organizations,
    })
  } catch (error) {
    console.error('Failed to fetch organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 },
    )
  }
}
