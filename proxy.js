import { NextResponse } from 'next/server'

const includedPaths = ['auth', 'payment', 'delete-account']

export function proxy(request) {
  const { pathname } = request.nextUrl
  const authRoutes = ['/auth']
  const isAuthRoute = authRoutes.includes(pathname)
  // Check authentication for all other pages
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true'

  // Agar token bor va auth sahifasiga kirmoqchi bo'lsa → operations ga yo'naltir
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/operations', request.url))
  }


  // Allow paths that don't require auth
  if (includedPaths.some(path => pathname.startsWith(`/${path}`))) {
    return NextResponse.next() // is_group=false/true
  }



  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}