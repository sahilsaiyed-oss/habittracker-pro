import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if token exists in cookies
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that require being logged out (Login/Signup)
  const authPaths = ['/login', '/signup'];
  
  // Paths that require being logged in
  const protectedPaths = ['/dashboard', '/habits', '/matrix', '/analytics', '/settings'];

  // 1. Redirect to login if trying to access protected page without token
  if (!token && protectedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Redirect to dashboard if logged in but trying to access login/signup
  if (token && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}