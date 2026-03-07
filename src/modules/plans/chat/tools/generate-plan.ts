import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const generatePlanSchema = z.object({});

export const generatePlanTool = tool(async () => 'Plan generation started.', {
  name: 'generate_plan',
  description: `Generate or regenerate the full project plan (phases and milestones) from the project soul. Use when the user wants to create a plan from scratch or completely regenerate the existing plan. When regenerating, all existing phases and milestones are replaced with newly generated ones.`,
  schema: generatePlanSchema,
});
