import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const completeStepSchema = z.object({
  milestoneId: z.string().describe('ID of the milestone containing the step'),
  stepId: z.string().describe('ID of the step to toggle completion'),
});

export const completeStepTool = tool(async () => 'Step toggled.', {
  name: 'complete_step',
  description: `Toggle a milestone step's completion status. Use when the user says they've finished a step or wants to mark/unmark it as done.`,
  schema: completeStepSchema,
});
