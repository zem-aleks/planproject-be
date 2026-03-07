import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const proposePlanUpdateSchema = z.object({
  description: z
    .string()
    .describe(
      'A user-facing summary of all proposed changes. Shown in the approval prompt. Be specific: name what sections are affected, what gets added/removed/updated.',
    ),
  soul: z
    .string()
    .optional()
    .describe(
      'Instructions for updating the project profile (soul). Describe what sections to change, what to add/remove/modify, and the new values. Only include if the proposal affects the project profile.',
    ),
  plan: z
    .string()
    .optional()
    .describe(
      'Instructions for updating the project plan (phases and milestones). Describe which phases to add, remove, reorder, or modify, and any milestone changes within them. Only include if the proposal affects phases or milestones.',
    ),
});

export const proposePlanUpdateTool = tool(
  async () => 'Proposal submitted for user confirmation.',
  {
    name: 'propose_plan_update',
    description: `Propose changes to the project. This single tool handles all types of changes: project profile (soul) and plan structure (phases + milestones). Fill in only the sections that need changes. The user must approve the proposal before any changes take effect. Always load relevant data first (load_phases, load_milestones) before proposing changes.`,
    schema: proposePlanUpdateSchema,
  },
);
