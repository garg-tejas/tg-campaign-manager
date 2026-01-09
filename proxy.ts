import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple string comparison (for local use only, not timing-safe)
// For a local dashboard, this is acceptable security
function simpleCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export function proxy(request: NextRequest) {
  const authCookie = request.cookies.get('auth')
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  const isAuthenticated = authCookie && simpleCompare(authCookie.value, adminPassword)

  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname.startsWith('/api/auth')) {
    if (isAuthenticated && request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
