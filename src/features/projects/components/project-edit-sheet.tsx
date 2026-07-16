'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProjectMutation } from '../api/mutations';
import { projectKeys } from '../api/queries';
import { toast } from 'sonner';
import * as z from 'zod';
import { projectSchema, type ProjectFormValues } from '../schemas/project';
import type { Project } from '../api/types';
import { useRouter } from 'next/navigation';

type ProjectEditSheetProps = {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ProjectEditSheet({ project, open, onOpenChange }: ProjectEditSheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    ...updateProjectMutation,
    onSuccess: () => {
      toast.success('Project updated successfully');
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to update project');
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
      name: project.name,
      slug: project.slug,
      description: project.description ?? ''
    } as ProjectFormValues,
    validators: {
      onSubmit: projectSchema
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        id: project.id,
        data: {
          name: value.name,
          slug: value.slug || slugify(value.name),
          description: value.description
        }
      });
    }
  });

  const { FormTextField, FormTextareaField } = useFormFields<ProjectFormValues>();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>Edit Project</SheetTitle>
          <SheetDescription>Update your project details below.</SheetDescription>
        </SheetHeader>

        <form.AppForm>
          <form.Form className='flex flex-1 flex-col gap-4 px-6 py-4'>
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

            <SheetFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <form.SubmitButton>Save Changes</form.SubmitButton>
            </SheetFooter>
          </form.Form>
        </form.AppForm>
      </SheetContent>
    </Sheet>
  );
}
