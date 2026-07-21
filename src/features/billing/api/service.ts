// ============================================================
// Billing Service — Data Access Layer
// ============================================================

import { db } from '@/lib/db';
import { user, projects } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import type { Plan, UserPlanInfo } from './types';
import { FREE_PROJECT_LIMIT } from './constants';

export async function getUserPlan(userId: string): Promise<UserPlanInfo> {
  try {
    const [row] = await db
      .select({
        plan: user.plan
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return {
      plan: row?.plan ?? 'free',
      paddleSubscriptionId: null,
      paddleCustomerId: null
    };
  } catch (error) {
    console.error('[Billing] Error fetching user plan:', error);
    return { plan: 'free', paddleSubscriptionId: null, paddleCustomerId: null };
  }
}

export async function updateUserPlan(userId: string, plan: Plan): Promise<void> {
  await db.update(user).set({ plan, updatedAt: new Date() }).where(eq(user.id, userId));
}

export async function getUserProjectCount(userId: string): Promise<number> {
  try {
    const [result] = await db
      .select({ value: count() })
      .from(projects)
      .where(eq(projects.userId, userId));

    return result?.value ?? 0;
  } catch (error) {
    console.error('[Billing] Error counting projects:', error);
    return 0;
  }
}

export async function canCreateProject(
  userId: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  try {
    const [planInfo, projectCount] = await Promise.all([
      getUserPlan(userId),
      getUserProjectCount(userId)
    ]);

    const limit = planInfo.plan === 'pro' ? Infinity : FREE_PROJECT_LIMIT;

    return {
      allowed: projectCount < limit,
      current: projectCount,
      limit: planInfo.plan === 'pro' ? -1 : FREE_PROJECT_LIMIT
    };
  } catch (error) {
    console.error('[Billing] Error checking project limit:', error);
    return { allowed: true, current: 0, limit: -1 };
  }
}
