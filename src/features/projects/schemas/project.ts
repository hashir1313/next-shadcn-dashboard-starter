import * as z from 'zod';

export const projectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters.'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe (lowercase, numbers, hyphens).'),
  description: z.string().optional()
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
  description: z.string().optional()
});

export type TaskFormValues = z.infer<typeof taskSchema>;
