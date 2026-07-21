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

  const currentPlan = planData?.data?.plan ?? 'free';
  const projectInfo = limitData?.data;
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
      if (planId === 'free') {
        checkoutMutation.mutate({ planId: 'free' });
        return;
      }

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
    [paddleReady, user?.email, userId, checkoutMutation]
  );

  return (
    <PageContainer
      pageTitle='Billing & Plans'
      pageDescription='Manage your subscription and usage limits.'
    >
      <div className='space-y-6'>
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
          </CardContent>
        </Card>

        <div className='grid gap-4 md:grid-cols-2'>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isDowngrade = currentPlan === 'pro' && plan.id === 'free';

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
                  {!isCurrent && (
                    <Button
                      className='w-full'
                      variant={isDowngrade ? 'outline' : 'default'}
                      onClick={() => handleCheckout(plan.id)}
                      disabled={checkoutMutation.isPending}
                    >
                      {checkoutMutation.isPending && (
                        <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                      )}
                      {isDowngrade
                        ? 'Downgrade to Free'
                        : currentPlan === 'free'
                          ? 'Upgrade to Pro'
                          : 'Switch Plan'}
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
      </div>
    </PageContainer>
  );
}
