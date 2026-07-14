import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)',
  '/api(.*)',
  // Public project pages: /{username}/{projectSlug}
  // These are catch-all dynamic routes — handled by the negated matcher below
]);

const isDashboardRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isDashboardRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
