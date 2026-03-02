import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const proposeSoulUpdateSchema = z.object({
  description: z
    .string()
    .describe(
      'A clear description of all changes to make to the project profile. Be specific: name the sections being changed, what is being added/removed/modified, and the new values. e.g. "Resolve the Launch timeline open question: set timeline to 6 months. Add decision: chosen S-Corp for tax efficiency. Add constraint: must launch within 6 months."',
    ),
});

export const proposeSoulUpdateTool = tool(
  async () => 'Proposal submitted for user confirmation.',
  {
    name: 'propose_soul_update',
    description: `Propose changes to the project's soul (structured profile). Call this when the conversation reveals actionable updates: resolved open questions, new constraints, new assumptions, priority changes, new workstreams, corrections, or explicit user requests. Describe ALL changes that should be made — the system will generate the full updated profile. The user must approve each proposal before it takes effect.`,
    schema: proposeSoulUpdateSchema,
  },
);
