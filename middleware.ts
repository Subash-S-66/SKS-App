import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth')
  const isPublicRoute = isApiAuthRoute

  // Use getToken for beta v5 compatible decoding since we added needsPasswordChange to jwt token
  const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: request.url.startsWith('https://') ? '__Secure-authjs.session-token' : 'authjs.session-token'
  })

  // Fallback for cookie names in dev
  const fallbackToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
  })

  const currentToken = token || fallbackToken
  const isLoggedIn = !!currentToken

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

  const needsPasswordChange = currentToken?.needsPasswordChange as boolean

  // Force redirect to settings if password change is needed
  if (needsPasswordChange && !request.nextUrl.pathname.startsWith('/settings') && !request.nextUrl.pathname.startsWith('/api/users/change-password')) {
      return NextResponse.redirect(new URL('/settings?forceChange=true', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
