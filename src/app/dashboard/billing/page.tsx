'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/lib/auth-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';

export default function BillingPage() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;

  return (
    <PageContainer
      pageTitle='Billing & Plans'
      pageDescription='Manage your subscription and usage limits.'
    >
      <div className='space-y-6'>
        <Alert>
          <Icons.info className='h-4 w-4' />
          <AlertDescription>
            Plans and subscriptions are managed through Paddle. Subscribe to a plan to unlock
            features and higher limits.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your current subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-4'>
              <div className='rounded-lg border bg-muted/50 px-4 py-2'>
                <span className='text-lg font-semibold'>Free</span>
              </div>
              <div className='text-muted-foreground text-sm'>
                You are on the Free plan. Upgrade to Pro for unlimited projects and branding.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Choose a plan that fits your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='rounded-lg border p-6'>
                <h3 className='text-lg font-semibold'>Free</h3>
                <p className='text-muted-foreground mt-1 text-sm'>
                  Core features for getting started
                </p>
                <ul className='text-muted-foreground mt-4 space-y-2 text-sm'>
                  <li>• Up to 3 projects</li>
                  <li>• Basic task management</li>
                  <li>• Public progress pages</li>
                  <li>• 10 dashboard themes</li>
                </ul>
              </div>
              <div className='rounded-lg border border-primary/50 p-6'>
                <h3 className='text-lg font-semibold'>Pro</h3>
                <p className='text-muted-foreground mt-1 text-sm'>
                  For professionals who need more
                </p>
                <ul className='text-muted-foreground mt-4 space-y-2 text-sm'>
                  <li>• Unlimited projects</li>
                  <li>• Branded public pages</li>
                  <li>• Custom themes & logo</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
