// ============================================================
// Branding Service — Data Access Layer
// ============================================================
// This is the ONLY file you modify when connecting to your backend.
//
// Current: Drizzle ORM (Neon PostgreSQL)
// ============================================================

import { db } from '@/lib/db';
import { brandingConfigs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { BrandingConfig, BrandingMutationPayload, BrandingResponse } from './types';

export async function getBranding(userId: string): Promise<BrandingResponse> {
  const [data] = await db
    .select()
    .from(brandingConfigs)
    .where(eq(brandingConfigs.userId, userId))
    .limit(1);

  if (!data) {
    return { success: true, data: null, message: 'No branding config' };
  }

  return {
    success: true,
    data: {
      userId: data.userId,
      primaryColor: data.primaryColor,
      backgroundColor: data.backgroundColor,
      fontFamily: data.fontFamily,
      borderRadius: data.borderRadius,
      logoUrl: data.logoUrl,
      updatedAt: data.updatedAt.toISOString()
    },
    message: 'Branding config found'
  };
}

export async function upsertBranding(
  userId: string,
  data: BrandingMutationPayload
): Promise<BrandingResponse> {
  const [existing] = await db
    .select()
    .from(brandingConfigs)
    .where(eq(brandingConfigs.userId, userId))
    .limit(1);

  let result;

  if (existing) {
    [result] = await db
      .update(brandingConfigs)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(brandingConfigs.userId, userId))
      .returning();
  } else {
    [result] = await db
      .insert(brandingConfigs)
      .values({
        userId,
        primaryColor: data.primaryColor || '#000000',
        backgroundColor: data.backgroundColor || '#ffffff',
        fontFamily: data.fontFamily || 'inter',
        borderRadius: data.borderRadius || 8,
        logoUrl: data.logoUrl || null
      })
      .returning();
  }

  return {
    success: true,
    data: {
      userId: result.userId,
      primaryColor: result.primaryColor,
      backgroundColor: result.backgroundColor,
      fontFamily: result.fontFamily,
      borderRadius: result.borderRadius,
      logoUrl: result.logoUrl,
      updatedAt: result.updatedAt.toISOString()
    },
    message: 'Branding updated'
  };
}
