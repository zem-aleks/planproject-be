import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const updateStepSchema = z.object({
  milestoneId: z.string().describe('ID of the milestone containing the step'),
  stepId: z.string().describe('ID of the step to update'),
  field: z
    .enum(['title', 'description'])
    .describe('The field to update on the step'),
  value: z.string().describe('New value for the field'),
});

export const updateStepTool = tool(async () => 'Step updated.', {
  name: 'update_step',
  description: `Update a step's title or description within a milestone. Load milestones first to get milestone and step IDs.`,
  schema: updateStepSchema,
});
