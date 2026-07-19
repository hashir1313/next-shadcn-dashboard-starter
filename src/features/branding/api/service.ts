// ============================================================
// Branding Service — Data Access Layer
// ============================================================
// This is the ONLY file you modify when connecting to your backend.
//
// Current: Mock data store
// ============================================================

import type { BrandingConfig, BrandingMutationPayload, BrandingResponse } from './types';
import { fakeBranding } from '@/constants/mock-api-branding';

export async function getBranding(userId: string): Promise<BrandingResponse> {
  const data = await fakeBranding.getBranding(userId);
  return {
    success: true,
    data,
    message: data ? 'Branding config found' : 'No branding config'
  };
}

export async function upsertBranding(
  userId: string,
  data: BrandingMutationPayload
): Promise<BrandingResponse> {
  const updated = await fakeBranding.upsertBranding(userId, data);
  return {
    success: true,
    data: updated,
    message: 'Branding updated'
  };
}
