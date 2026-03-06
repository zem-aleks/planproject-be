import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const toggleFocusSchema = z.object({
  milestoneId: z.string().describe('ID of the milestone to toggle focus on'),
});

export const toggleFocusTool = tool(async () => 'Focus toggled.', {
  name: 'toggle_focus',
  description: `Toggle focus on a single milestone without affecting other focused milestones. If focused — unfocuses it. If not focused — focuses it (and auto-activates if not started). Use when the user wants to add or remove a single milestone from their focus. For replacing all focus at once, use switch_focus instead.`,
  schema: toggleFocusSchema,
});
