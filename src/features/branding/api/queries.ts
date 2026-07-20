import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { BrandingConfig, BrandingMutationPayload, BrandingResponse } from './types';

export type { BrandingConfig, BrandingMutationPayload } from './types';

export const brandingKeys = {
  all: ['branding'] as const,
  detail: (userId: string) => [...brandingKeys.all, 'detail', userId] as const
};

export const brandingQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: brandingKeys.detail(userId),
    queryFn: () => apiClient<BrandingResponse>('/settings/branding')
  });

export async function updateBranding(userId: string, data: BrandingMutationPayload) {
  return apiClient<BrandingResponse>('/settings/branding', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
