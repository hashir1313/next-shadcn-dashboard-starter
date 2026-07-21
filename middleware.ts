import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/admin'];
const authRoutes = ['/auth/sign-in', '/auth/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Check for Better Auth session cookie
  const sessionCookie = request.cookies.get('better-auth.session_token');
  const hasSession = !!sessionCookie?.value;

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !hasSession) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard/overview', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|api/auth|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'
  ]
};
