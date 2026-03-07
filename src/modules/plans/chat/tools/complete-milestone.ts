import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const completeMilestoneSchema = z.object({
  milestoneId: z.string().describe('ID of the milestone to complete'),
  message: z
    .string()
    .describe(
      'Completion summary — what was achieved and any notable outcomes',
    ),
});

export const completeMilestoneTool = tool(async () => 'Milestone completed.', {
  name: 'complete_milestone',
  description: `Mark a milestone as completed. Use when the user confirms they've finished a milestone or all its work is done. Provide a brief summary of what was achieved.`,
  schema: completeMilestoneSchema,
});
