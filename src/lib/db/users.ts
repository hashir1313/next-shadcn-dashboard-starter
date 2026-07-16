import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Ensures a Clerk user exists in the DB.
 * Called before any operation that requires a user_id FK.
 * Backfills publicEmail if the existing row has NULL.
 */
export async function ensureUser(clerkUser: {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  emailAddresses?: { emailAddress: string }[];
}) {
  const [existing] = await db.select().from(users).where(eq(users.id, clerkUser.id)).limit(1);

  if (existing) {
    // Backfill publicEmail if missing
    if (!existing.publicEmail && clerkUser.emailAddresses?.[0]?.emailAddress) {
      await db
        .update(users)
        .set({ publicEmail: clerkUser.emailAddresses[0].emailAddress })
        .where(eq(users.id, clerkUser.id));
      return { ...existing, publicEmail: clerkUser.emailAddresses[0].emailAddress };
    }
    return existing;
  }

  const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'User';
  const username =
    clerkUser.username ||
    clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    `user_${clerkUser.id.slice(-6)}`;
  const email = clerkUser.emailAddresses?.[0]?.emailAddress || null;

  await db.insert(users).values({
    id: clerkUser.id,
    username,
    displayName,
    publicEmail: email
  });

  const [created] = await db.select().from(users).where(eq(users.id, clerkUser.id)).limit(1);
  return created!;
}
