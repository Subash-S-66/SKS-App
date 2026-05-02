import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Mongoose doesn't work in Edge Runtime which middleware uses.
// Instead of using the full auth wrapper here which pulls in DB logic,
// we will just check the session cookie directly for minimal edge auth.

export function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth')
  const isPublicRoute = isApiAuthRoute

  // In NextAuth v5, the session token cookie name depends on secure context
  const token = request.cookies.get('authjs.session-token') || request.cookies.get('__Secure-authjs.session-token') || request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token')

  const isLoggedIn = !!token

  if (isPublicRoute) {
    return NextResponse.next()
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    let from = request.nextUrl.pathname;
    if (request.nextUrl.search) {
      from += request.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, request.url)
    );
  }

  // NOTE: Role-based edge protection requires decoding the JWT.
  // NextAuth v5 edge wrapper is complex to setup without DB connections in beta.
  // The pages and API routes still strictly verify the session and role using full Node runtime.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
