import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get a user by ID from the database.
 * With Better Auth, users are created automatically on sign-up.
 */
export async function getUserById(userId: string) {
  const [found] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  return found || null;
}

/**
 * Update user profile fields.
 */
export async function updateUserProfile(
  userId: string,
  data: {
    username?: string;
    displayName?: string;
    publicEmail?: string;
    logoUrl?: string;
  }
) {
  await db
    .update(user)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(user.id, userId));
}
