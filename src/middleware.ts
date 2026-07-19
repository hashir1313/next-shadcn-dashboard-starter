import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const BLOCKED_STATUSES = ['deleted', 'suspended'];

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (sessionCookie && request.nextUrl.pathname.startsWith('/dashboard')) {
    // Check user status via a lightweight API call
    try {
      const res = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
        headers: { cookie: request.headers.get('cookie') || '' }
      });

      if (res.ok) {
        const data = await res.json();
        const status = data?.session?.user?.status;

        if (status && BLOCKED_STATUSES.includes(status)) {
          const signInUrl = new URL('/auth/sign-in', request.url);
          signInUrl.searchParams.set('error', 'account-unavailable');
          const response = NextResponse.redirect(signInUrl);
          // Clear session cookie
          response.cookies.set('better-auth.session_token', '', { maxAge: 0, path: '/' });
          return response;
        }
      }
    } catch {
      // If session check fails, let the request continue — auth will handle it
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};
