'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export function SettingsAccountForm() {
  const { data: sessionData, refetch } = useSession();
  const user = sessionData?.user;
  const router = useRouter();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(
    ((user as Record<string, unknown>)?.username as string) || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  async function handleUpdateAccount() {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update account');
      }

      await refetch();
      toast.success('Account updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update account');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/settings/account', {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete account');
      }

      toast.success('Account deleted. Redirecting...');
      router.push('/auth/sign-in');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='name'>Name</Label>
        <Input
          id='name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Your name'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='username'>Username</Label>
        <Input
          id='username'
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
          placeholder='your-username'
        />
        <p className='text-muted-foreground text-xs'>
          Your public URL: /{username || 'your-username'}
        </p>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='email'>Email</Label>
        <Input id='email' value={user.email} disabled />
        <p className='text-muted-foreground text-xs'>Email cannot be changed from here.</p>
      </div>

      <Button onClick={handleUpdateAccount} disabled={isSaving || !name.trim()}>
        {isSaving && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
        Save Changes
      </Button>

      <div className='border-destructive/50 mt-8 border-t pt-6'>
        <h3 className='text-destructive text-lg font-medium'>Danger Zone</h3>
        <p className='text-muted-foreground mt-1 text-sm'>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant='destructive' className='mt-4' />}>
            Delete Account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account, all
                projects, tasks, and associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                {isDeleting && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
