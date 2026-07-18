'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WorkspacesPage() {
  return (
    <PageContainer
      pageTitle='Workspaces'
      pageDescription='Manage your workspaces and switch between them.'
    >
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Workspaces</CardTitle>
            <CardDescription>
              Organization features coming soon. Better Auth supports teams and organizations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground mb-4'>
              Workspaces allow you to collaborate with team members and manage shared projects.
            </p>
            <Button disabled>Coming Soon</Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
