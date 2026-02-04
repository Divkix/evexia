import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({
            request,
          })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // SECURITY: Auth bypass is ONLY allowed in development
  // Explicit NODE_ENV check as defense-in-depth
  const bypassAuth =
    process.env.NODE_ENV !== 'production' &&
    process.env.BYPASS_AUTH_LOCAL === 'true'

  // Protected routes that require authentication
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/patient') &&
    !request.nextUrl.pathname.startsWith('/patient/login')

  if (isProtectedRoute && !user && !bypassAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/patient/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
