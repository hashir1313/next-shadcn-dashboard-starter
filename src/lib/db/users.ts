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
    name?: string;
    publicEmail?: string;
    logoUrl?: string;
    dashboardTheme?: string;
    dashboardMode?: 'light' | 'dark' | 'system';
  }
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.username !== undefined) updateData.username = data.username;
  if (data.displayName !== undefined) updateData.name = data.displayName;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.publicEmail !== undefined) updateData.publicEmail = data.publicEmail;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.dashboardTheme !== undefined) updateData.dashboardTheme = data.dashboardTheme;
  if (data.dashboardMode !== undefined) updateData.dashboardMode = data.dashboardMode;

  await db.update(user).set(updateData).where(eq(user.id, userId));
}
