'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createProjectMutation } from '../api/mutations';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';
import { projectSchema, type ProjectFormValues } from '../schemas/project';
import { useSession } from '@/lib/auth-client';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiError } from '@/lib/api-client';

export default function ProjectForm() {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const userId = sessionData?.user?.id;
  const [initialTasks, setInitialTasks] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [limitError, setLimitError] = useState<string | null>(null);

  const createMutation = useMutation({
    ...createProjectMutation,
    onSuccess: (data) => {
      toast.success('Project created successfully');
      setLimitError(null);
      if (data.data) {
        router.push(`/dashboard/projects/${data.data.id}`);
      } else {
        router.push('/dashboard/projects');
      }
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && error.data?.code === 'PROJECT_LIMIT_REACHED') {
        setLimitError(
          (error.data.message as string) ||
            "You've reached the project limit. Upgrade to Pro for unlimited projects."
        );
      } else {
        toast.error('Failed to create project');
      }
    }
  });

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  const form = useAppForm({
    defaultValues: {
      name: '',
      slug: '',
      description: ''
    } as ProjectFormValues,
    validators: {
      onSubmit: projectSchema
    },
    onSubmit: ({ value }) => {
      if (!userId) return;
      const tasks = initialTasks.filter((t) => t.trim()).map((title) => ({ title: title.trim() }));
      createMutation.mutate({
        userId,
        data: {
          name: value.name,
          slug: value.slug || slugify(value.name),
          description: value.description,
          tasks: tasks.length > 0 ? tasks : undefined
        }
      });
    }
  });

  const { FormTextField, FormTextareaField } = useFormFields<ProjectFormValues>();

  function handleAddTask() {
    if (!taskInput.trim()) return;
    setInitialTasks((prev) => [...prev, taskInput.trim()]);
    setTaskInput('');
  }

  function handleRemoveTask(index: number) {
    setInitialTasks((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>Create New Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-6'>
            {limitError && (
              <Alert variant='destructive'>
                <Icons.warning className='h-4 w-4' />
                <AlertDescription className='flex items-center justify-between'>
                  <span>{limitError}</span>
                  <Button size='sm' onClick={() => router.push('/dashboard/billing')}>
                    Upgrade to Pro
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <FormTextField
              name='name'
              label='Project Name'
              required
              placeholder='My Awesome Project'
              validators={{
                onBlur: z.string().min(2, 'Project name must be at least 2 characters.')
              }}
              listeners={{
                onChange: ({ fieldApi }) => {
                  const name = fieldApi.form.getFieldValue('name');
                  if (name) {
                    fieldApi.form.setFieldValue('slug', slugify(name));
                  }
                }
              }}
            />

            <FormTextField
              name='slug'
              label='Slug'
              required
              placeholder='my-awesome-project'
              description='Auto-generated from project name. Must be URL-safe.'
              validators={{
                onBlur: z
                  .string()
                  .min(2, 'Slug must be at least 2 characters.')
                  .regex(
                    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    'Slug must be URL-safe (lowercase, numbers, hyphens).'
                  )
              }}
            />

            <FormTextareaField
              name='description'
              label='Description'
              placeholder='Brief description of your project (optional)'
              maxLength={500}
              rows={3}
            />

            {/* Initial Tasks */}
            <div className='space-y-3'>
              <label className='text-sm font-medium'>
                Initial Tasks <span className='text-muted-foreground'>(optional)</span>
              </label>
              <div className='flex gap-2'>
                <Input
                  placeholder='Add a task...'
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                  className='flex-1'
                />
                <Button type='button' size='sm' variant='outline' onClick={handleAddTask}>
                  <Icons.add className='h-4 w-4' />
                </Button>
              </div>
              {initialTasks.length > 0 && (
                <div className='space-y-2'>
                  {initialTasks.map((task, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2'
                    >
                      <span className='flex-1 text-sm'>{task}</span>
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        onClick={() => handleRemoveTask(index)}
                        className='h-6 w-6 p-0 text-muted-foreground hover:text-destructive'
                      >
                        <Icons.close className='h-3 w-3' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {initialTasks.length > 0 && (
                <p className='text-xs text-muted-foreground'>
                  {initialTasks.length} task{initialTasks.length !== 1 ? 's' : ''} will be added
                  after project creation.
                </p>
              )}
            </div>

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Cancel
              </Button>
              <form.SubmitButton>Create Project</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
