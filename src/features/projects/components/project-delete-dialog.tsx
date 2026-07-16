'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProjectMutation } from '../api/mutations';
import { projectKeys } from '../api/queries';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Project } from '../api/types';

type ProjectDeleteDialogProps = {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ProjectDeleteDialog({
  project,
  open,
  onOpenChange
}: ProjectDeleteDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmName, setConfirmName] = useState('');

  const deleteMutation = useMutation({
    ...deleteProjectMutation,
    onSuccess: () => {
      toast.success('Project deleted');
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      onOpenChange(false);
      router.push('/dashboard/projects');
    },
    onError: () => {
      toast.error('Failed to delete project');
    }
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the project{' '}
            <span className='font-semibold text-foreground'>{project.name}</span> and all of its
            tasks.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='space-y-2'>
          <label className='text-sm font-medium' htmlFor='confirm-delete'>
            Type <span className='font-mono text-destructive'>{project.name}</span> to confirm.
          </label>
          <input
            id='confirm-delete'
            className='border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
            placeholder='Enter project name'
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmName('')}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmName !== project.name}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            onClick={() => deleteMutation.mutate(project.id)}
          >
            Delete Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
