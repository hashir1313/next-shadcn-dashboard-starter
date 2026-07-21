'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  billingPlanQueryOptions,
  projectLimitQueryOptions,
  billingKeys
} from '@/features/billing/api/queries';
import { PLANS, PADDLE_CLIENT_TOKEN, PADDLE_PRO_PRICE_ID } from '@/features/billing/api/constants';
import { toast } from 'sonner';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Paddle } from '@paddle/paddle-js';

type Invoice = {
  id: string;
  status: string;
  createdAt: string;
  currency: string;
  total: number;
  invoiceNumber: string;
};

export default function BillingPage() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const userId = user?.id ?? '';
  const queryClient = useQueryClient();
  const paddleRef = useRef<Paddle | null>(null);
  const [paddleReady, setPaddleReady] = useState(false);

  const { data: planData } = useQuery({
    ...billingPlanQueryOptions(userId),
    enabled: !!userId
  });

  const { data: limitData } = useQuery({
    ...projectLimitQueryOptions(userId),
    enabled: !!userId
  });

  const { data: invoiceData } = useQuery({
    queryKey: billingKeys.invoices(userId),
    queryFn: async () => {
      const res = await fetch(`/api/billing/invoices?userId=${userId}`);
      return res.json() as Promise<{ success: boolean; data: Invoice[] }>;
    },
    enabled: !!userId && (planData?.data?.plan ?? 'free') === 'pro'
  });

  const currentPlan = planData?.data?.plan ?? 'free';
  const projectInfo = limitData?.data;
  const invoices = invoiceData?.data ?? [];
  const searchParams = useSearchParams();
  const successParam = searchParams.get('success');

  useEffect(() => {
    if (successParam === '1' && userId) {
      fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan: 'pro' })
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: billingKeys.all });
        toast.success('Successfully upgraded to Pro!');
      });
    }
  }, [successParam, userId, queryClient]);

  const checkoutMutation = useMutation({
    mutationFn: async ({ planId }: { planId: string }) => {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan: planId })
      });
      if (!res.ok) throw new Error('Checkout failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      toast.success('Plan updated successfully');
    },
    onError: () => {
      toast.error('Failed to update plan');
    }
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to open portal');
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.data.url;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to open subscription management');
    }
  });

  useEffect(() => {
    if (PADDLE_CLIENT_TOKEN && !paddleRef.current) {
      import('@paddle/paddle-js').then(({ initializePaddle }) => {
        initializePaddle({
          token: PADDLE_CLIENT_TOKEN,
          environment: PADDLE_CLIENT_TOKEN.startsWith('test_') ? 'sandbox' : 'production'
        })
          .then((paddleInstance) => {
            paddleRef.current = paddleInstance ?? null;
            setPaddleReady(true);
          })
          .catch((err) => {
            console.error('[Billing] Failed to initialize Paddle:', err);
          });
      });
    }
  }, []);

  const handleCheckout = useCallback(
    (planId: string) => {
      if (paddleReady && paddleRef.current) {
        paddleRef.current.Checkout.open({
          items: [{ priceId: PADDLE_PRO_PRICE_ID, quantity: 1 }],
          ...(user?.email ? { customer: { email: user.email } } : {}),
          customData: { userId },
          settings: {
            successUrl: `${window.location.origin}/dashboard/billing?success=1`
          }
        });
      } else {
        toast.error('Payment system is loading. Please try again in a moment.');
      }
    },
    [paddleReady, user?.email, userId]
  );

  function formatAmount(total: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(total / 100);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  return (
    <PageContainer
      pageTitle='Billing & Plans'
      pageDescription='Manage your subscription and usage limits.'
    >
      <div className='space-y-6'>
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your current subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-4'>
              <div className='rounded-lg border bg-muted/50 px-4 py-2'>
                <span className='text-lg font-semibold'>
                  {currentPlan === 'pro' ? 'Pro' : 'Free'}
                </span>
              </div>
              <Badge variant={currentPlan === 'pro' ? 'default' : 'secondary'}>
                {currentPlan === 'pro' ? 'Pro' : 'Free'}
              </Badge>
              {projectInfo && currentPlan === 'free' && (
                <div className='text-muted-foreground text-sm'>
                  {projectInfo.current}/{projectInfo.limit} projects used
                </div>
              )}
              {currentPlan === 'pro' && (
                <div className='text-muted-foreground text-sm'>Unlimited projects</div>
              )}
            </div>
            {currentPlan === 'pro' && (
              <div className='mt-4'>
                <Button
                  variant='outline'
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                >
                  {portalMutation.isPending ? (
                    <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Icons.settings className='mr-2 h-4 w-4' />
                  )}
                  Manage Subscription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plans */}
        <div className='grid gap-4 md:grid-cols-2'>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;

            return (
              <Card key={plan.id} className={isCurrent ? 'border-primary/50' : ''}>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    {plan.name}
                    {isCurrent && (
                      <Badge variant={currentPlan === 'pro' ? 'default' : 'secondary'}>
                        Current
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='text-3xl font-bold'>
                    {plan.price}
                    <span className='text-muted-foreground text-sm font-normal'>
                      {plan.interval}
                    </span>
                  </div>
                  <ul className='text-muted-foreground space-y-2 text-sm'>
                    {plan.features.map((feature) => (
                      <li key={feature} className='flex items-center gap-2'>
                        <Icons.check className='h-4 w-4 text-green-500' />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && plan.id === 'pro' && (
                    <Button
                      className='w-full'
                      onClick={() => handleCheckout(plan.id)}
                      disabled={checkoutMutation.isPending}
                    >
                      {checkoutMutation.isPending && (
                        <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                      )}
                      Upgrade to Pro
                    </Button>
                  )}
                  {isCurrent && (
                    <Button className='w-full' variant='outline' disabled>
                      Current Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Invoice History */}
        {currentPlan === 'pro' && invoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>Your past payments and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className='flex items-center justify-between rounded-lg border p-3'
                  >
                    <div className='flex items-center gap-4'>
                      <div>
                        <p className='text-sm font-medium'>{invoice.invoiceNumber || invoice.id}</p>
                        <p className='text-muted-foreground text-xs'>
                          {formatDate(invoice.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <Badge
                        variant={
                          invoice.status === 'paid'
                            ? 'default'
                            : invoice.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {invoice.status}
                      </Badge>
                      <span className='text-sm font-medium'>
                        {formatAmount(invoice.total, invoice.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
