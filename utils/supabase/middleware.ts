import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Check for demo credentials first - this works without Supabase
  const demoToken = request.cookies.get('groupo_token')?.value
  const isDemoUser = demoToken && demoToken.startsWith('demo_token_')

  // Allow access to portal pages, home page, and API routes without authentication
  const allowedPaths = [
    '/',
    '/buyer-portal',
    '/manufacturer-portal',
    '/api',
    '/login',
    '/auth'
  ]
  
  const isAllowedPath = allowedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // If it's a demo user or allowed path, let them through
  if (isDemoUser || isAllowedPath) {
    return NextResponse.next({ request })
  }

  // Only try Supabase if we have the required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    // If no Supabase config, allow access to all paths for demo purposes
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Redirect to home page if no user and not an allowed path
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    // If Supabase fails, allow access for demo purposes
    console.error('Supabase middleware error:', error)
    return NextResponse.next({ request })
  }
}
