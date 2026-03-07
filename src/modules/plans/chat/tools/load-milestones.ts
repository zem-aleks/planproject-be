import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const loadMilestonesSchema = z.object({
  phaseId: z
    .string()
    .optional()
    .describe(
      'Optional phase ID to filter milestones. Omit to load all project milestones.',
    ),
});

export const loadMilestonesTool = tool(async () => 'Milestones loaded.', {
  name: 'load_milestones',
  description: `Load milestones for the current project, optionally filtered by phase. Use this when the user asks about milestones, deliverables, progress on specific work, or definition of done.`,
  schema: loadMilestonesSchema,
});
