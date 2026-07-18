'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/lib/auth-client';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function ExclusivePage() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;

  return (
    <PageContainer
      pageTitle='Exclusive Area'
      pageDescription='Premium features for Pro plan users.'
    >
      <div className='space-y-6'>
        <Alert>
          <Icons.lock className='h-5 text-yellow-600' />
          <AlertDescription>
            <div className='mb-1 text-lg font-semibold'>Pro Plan Required</div>
            <div className='text-muted-foreground'>
              This page is only available to users on the <span className='font-semibold'>Pro</span>{' '}
              plan.
              <br />
              Upgrade your subscription in&nbsp;
              <Link className='underline' href='/dashboard/billing'>
                Billing &amp; Plans
              </Link>
              .
            </div>
          </AlertDescription>
        </Alert>

        <div className='space-y-6'>
          <div>
            <h1 className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
              <Icons.badgeCheck className='h-7 w-7 text-green-600' />
              Exclusive Area
            </h1>
            <p className='text-muted-foreground'>
              Welcome, <span className='font-semibold'>{user?.name}</span>! This page contains
              exclusive features for Pro plan users.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Thank You for Checking Out the Exclusive Page</CardTitle>
              <CardDescription>This means you are subscribed to the Pro plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-lg'>Have a wonderful day!</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
