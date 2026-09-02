import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Optimistic check for the session cookie
  // Better Auth uses different cookie names based on secure context
  const sessionCookie = request.cookies.get('better-auth.session_token') || 
                        request.cookies.get('__Secure-better-auth.session_token');

  const { pathname } = request.nextUrl;

  // Protect /welcome route
  if (pathname.startsWith('/welcome')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname === '/login' || pathname === '/signup') {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/welcome', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/welcome', '/login', '/signup'],
};
