import { z } from 'zod';

export type ProjectEntity = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const CREATE_PROJECT_SCHEMA = z.object({
  title: z.string().trim(),
  description: z.string().trim().nullable(),
  logoUrl: z
    .string()
    .trim()
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .refine((val) => val === null || z.string().url().safeParse(val).success, {
      message: 'Invalid URL',
    }),
});

export type ProjectCreateData = z.infer<typeof CREATE_PROJECT_SCHEMA>;
