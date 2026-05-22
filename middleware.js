import { NextResponse } from 'next/server'

const includedPaths = ['auth', 'payment']

export function middleware(request) {
  const { pathname } = request.nextUrl


  // Allow paths that don't require auth
  if (includedPaths.some(path => pathname.startsWith(`/${path}`))) {
    return NextResponse.next() // is_group=false/true
  }

  // Check authentication for all other pages
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true'

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}