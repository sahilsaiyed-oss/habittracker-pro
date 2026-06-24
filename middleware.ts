import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Browser ke cookies mein se Token nikaalo
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 2. Define karo kaunse raste (routes) protected hain
  const isProtectedRoute = 
    pathname === '/' || 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/habits') || 
    pathname.startsWith('/analytics') || 
    pathname.startsWith('/matrix') || 
    pathname.startsWith('/settings');

  // 3. Define karo Auth pages (Login/Signup)
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  // LOGIC A: Agar token NAHI hai aur user protected page par ja raha hai -> Redirect to Login
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // LOGIC B: Agar token HAI aur user Login/Signup par ja raha hai -> Redirect to Dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Ye config batata hai ki middleware har file par chalna chahiye (except images/api)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}