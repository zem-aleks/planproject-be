import { z } from 'zod';

export type ProjectEntity = {
  id: string;
  userId: string | null;
  shapingId: string;
  title: string;
  description: string | null;
  logoUrl: string | null;
  daysNeeded: number | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date;
  status: ProjectStatus;
};

export type ProjectStatus =
  | 'draft' // we started to get shaping messages but not finished yet
  | 'shaping' // the shaping conversation is finished, waiting for phases to be generated
  | 'analyzing' // phases are generated, milestones may be in progress. Opportunity to modify the structure of phases and milestones
  | 'active' // work on the project is started, phases and milestones are being worked on
  | 'completed' // all phases and milestones are completed
  | 'onHold' // the project is temporarily paused
  | 'cancelled';

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
