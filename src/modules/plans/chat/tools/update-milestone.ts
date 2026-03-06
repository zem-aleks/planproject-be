import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const updateMilestoneSchema = z.object({
  milestoneId: z.string().describe('ID of the milestone to update'),
  field: z
    .enum([
      'title',
      'description',
      'definitionOfDone',
      'usefulResources',
      'context',
    ])
    .describe('The field to update on the milestone'),
  value: z.string().describe('New value for the field'),
});

export const updateMilestoneTool = tool(async () => 'Milestone updated.', {
  name: 'update_milestone',
  description: `Update a single field on a milestone. Use \`context\` to record decisions, progress notes, blockers, or any important context the user should be aware of. Load milestones first to get the ID.`,
  schema: updateMilestoneSchema,
});
