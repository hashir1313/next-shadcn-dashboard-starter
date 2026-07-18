import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * Get the current session from Better Auth on the server side.
 * Returns the session object with user info, or null if not authenticated.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Get the current user ID from the session.
 * Returns the user ID string or null if not authenticated.
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}
