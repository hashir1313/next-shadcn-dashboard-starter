import { z } from 'zod';

export const brandingSchema = z.object({
  primaryColor: z.string().min(1, 'Primary color is required'),
  backgroundColor: z.string().min(1, 'Background color is required'),
  fontFamily: z.string().min(1, 'Font family is required'),
  borderRadius: z.number().min(0).max(24),
  logoUrl: z.string().url('Invalid URL').nullable().optional()
});

export type BrandingFormValues = z.infer<typeof brandingSchema>;
