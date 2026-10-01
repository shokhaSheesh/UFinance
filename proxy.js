import { NextResponse } from 'next/server'

const includedPaths = ['auth', 'm/auth', 'payment', 'delete-account']

// /:chatId/attendance — webview переклички для телеграм-бота, открывается без логина
const publicPatterns = [/^\/[^/]+\/attendance(\/|$)/]

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

  if (publicPatterns.some(pattern => pattern.test(pathname))) {
    return NextResponse.next()
  }



  if (!isAuthenticated) {
    // телефонная версия ведёт на свой экран входа
    const loginPath = pathname === '/m' || pathname.startsWith('/m/') ? '/m/auth' : '/auth'
    return NextResponse.redirect(new URL(loginPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}