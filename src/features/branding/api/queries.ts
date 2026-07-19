import { queryOptions } from '@tanstack/react-query';
import { getBranding, upsertBranding } from './service';
import type { BrandingMutationPayload } from './types';

export type { BrandingConfig, BrandingMutationPayload } from './types';

export const brandingKeys = {
  all: ['branding'] as const,
  detail: (userId: string) => [...brandingKeys.all, 'detail', userId] as const
};

export const brandingQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: brandingKeys.detail(userId),
    queryFn: () => getBranding(userId)
  });

export async function updateBranding(userId: string, data: BrandingMutationPayload) {
  return upsertBranding(userId, data);
}
