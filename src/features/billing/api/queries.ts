import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { UserPlanInfo } from './types';

export type { UserPlanInfo } from './types';

export const billingKeys = {
  all: ['billing'] as const,
  plan: (userId: string) => [...billingKeys.all, 'plan', userId] as const,
  projectLimit: (userId: string) => [...billingKeys.all, 'projectLimit', userId] as const,
  invoices: (userId: string) => [...billingKeys.all, 'invoices', userId] as const
};

export type PlanResponse = {
  success: boolean;
  data: UserPlanInfo;
  message: string;
};

export type ProjectLimitResponse = {
  success: boolean;
  data: { allowed: boolean; current: number; limit: number };
  message: string;
};

export const billingPlanQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: billingKeys.plan(userId),
    queryFn: () => apiClient<PlanResponse>(`/billing/plan?userId=${userId}`)
  });

export const projectLimitQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: billingKeys.projectLimit(userId),
    queryFn: () => apiClient<ProjectLimitResponse>(`/billing/project-limit?userId=${userId}`)
  });
