'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';

export default function ProfileViewPage() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const router = useRouter();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  async function handleUpdateProfile() {
    setIsSaving(true);
    try {
      // Profile update would go through a server action or API route
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageContainer pageTitle='Profile' pageDescription='Manage your account settings.'>
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='name' className='text-sm font-medium'>
                Name
              </label>
              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Your name'
              />
            </div>
            <div className='space-y-2'>
              <label htmlFor='email' className='text-sm font-medium'>
                Email
              </label>
              <Input id='email' value={user.email} disabled />
              <p className='text-muted-foreground text-xs'>Email cannot be changed from here.</p>
            </div>
            <Button onClick={handleUpdateProfile} disabled={isSaving}>
              {isSaving && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant='destructive'
              onClick={() => toast.info('Account deletion coming soon')}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
