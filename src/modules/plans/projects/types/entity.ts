import { z } from 'zod';

export type ProjectPreviewEntity = {
  id: string;
  title: string;
  description: string | null;
  logoUrl: string | null;
  status: ProjectStatus;
  daysNeeded: number | null;
  startedAt: Date;
  activated: boolean;
  soul: ProjectSoul | null;
  soulQueue: SoulOperation[];
  soulQueueStartedAt: Date | null;
  soulQueueApplying: boolean;
};

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
  completedAt: Date | null;
  status: ProjectStatus;
  activated: boolean;
  soul: ProjectSoul | null;
  soulQueue: SoulOperation[];
  soulQueueStartedAt: Date | null;
  soulQueueApplying: boolean;
};

export type ProjectStatus =
  | 'draft' // we started to get shaping messages but not finished yet
  | 'shaping' // the shaping conversation is finished, waiting for phases to be generated
  | 'soulBuilding'
  | 'soulError'
  | 'soulDone'
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

export const PROJECT_SOUL_SCHEMA = z.object({
  name: z.string().describe('Project name or best guess from conversation'),
  summary: z
    .string()
    .describe(
      '2-3 sentences: what it is, who its for, what problem it solves or goal it achieves',
    ),
  domain: z
    .string()
    .describe(
      'Freeform domain label, e.g. "software development", "competitive chess", "business launch", "fitness", "creative writing", "game development"',
    ),

  currentState: z.object({
    description: z
      .string()
      .describe(
        'Where the user is right now relative to this goal. What exists already — skills, code, assets, experience, progress',
      ),
    keyMetrics: z
      .array(z.string())
      .nullable()
      .describe(
        'Quantifiable current state indicators, e.g. "ELO 2200", "0 lines of code", "$5k saved"',
      ),
  }),

  desiredOutcomes: z.array(
    z.object({
      outcome: z.string().describe('Concrete, measurable success criterion'),
      inferred: z
        .boolean()
        .describe('True if AI added this, not explicitly stated by user'),
    }),
  ),

  targetUsers: z
    .object({
      description: z
        .string()
        .describe('Who benefits from this project and in what context'),
      segments: z
        .array(z.string())
        .describe('Distinct user or audience groups'),
    })
    .nullable()
    .describe('Null if not applicable, e.g. for personal goals'),

  workstreams: z.array(
    z.object({
      name: z.string().describe('Workstream name'),
      description: z
        .string()
        .describe('One-line description of this area of effort'),
      priority: z.enum(['must', 'should', 'nice-to-have']),
      inferred: z.boolean().describe('True if AI added this, not the user'),
    }),
  ),

  resources: z.array(
    z.object({
      name: z.string().describe('Resource, tool, technology, or asset name'),
      relevance: z.string().describe('How this is used in the project'),
      tentative: z.boolean().describe('True if mentioned but not confirmed'),
    }),
  ),

  constraints: z.array(
    z.object({
      type: z
        .string()
        .describe(
          'e.g. timeline, budget, team, technical, platform, physical, geographic, skill',
        ),
      description: z.string(),
    }),
  ),

  decisions: z.array(
    z.object({
      topic: z.string(),
      chosen: z.string(),
      rationale: z.string().nullable(),
    }),
  ),

  openQuestions: z
    .array(
      z.object({
        topic: z.string(),
        context: z.string().nullable().describe('Why this needs deciding'),
        status: z.enum(['discussed_unresolved', 'not_discussed']),
        impact: z.enum(['blocking', 'important', 'minor']),
        impactReason: z
          .string()
          .describe(
            'One sentence: what gets stuck or degraded if this stays unresolved',
          ),
        suggestedOptions: z
          .array(z.string())
          .nullable()
          .describe('2-3 concrete options if possible'),
      }),
    )
    .default([]),

  assumptions: z
    .array(
      z.object({
        assumption: z.string(),
        reasoning: z.string(),
        affectedAreas: z
          .array(z.string())
          .describe('Which workstreams, entities, or outcomes this touches'),
      }),
    )
    .default([]),

  domainContext: z
    .array(z.string())
    .default([])
    .describe(
      'Domain-specific knowledge agents will need. Coding conventions for software, regulations for business, training principles for fitness, etc.',
    ),
});

export type ProjectSoul = z.infer<typeof PROJECT_SOUL_SCHEMA>;

export const ADD_SOUL_OPERATION_SCHEMA = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('answer_open_question'),
    topic: z.string().trim(),
    chosenOption: z.string().trim(),
  }),
  z.object({
    type: z.literal('remove_open_question'),
    topic: z.string().trim(),
  }),
  z.object({
    type: z.literal('accept_assumption'),
    assumption: z.string().trim(),
  }),
  z.object({
    type: z.literal('remove_assumption'),
    assumption: z.string().trim(),
  }),
  z.object({
    type: z.literal('apply_proposal'),
    description: z.string().trim(),
    proposalId: z.string().trim(),
    messageId: z.string().trim(),
  }),
]);

export type AddSoulOperationData = z.infer<typeof ADD_SOUL_OPERATION_SCHEMA>;

export type SoulOperation = AddSoulOperationData & { id: string };

export const REMOVE_SOUL_OPERATION_SCHEMA = z.object({
  operationId: z.string().trim(),
});

export type RemoveSoulOperationData = z.infer<
  typeof REMOVE_SOUL_OPERATION_SCHEMA
>;
