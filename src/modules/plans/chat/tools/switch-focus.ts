import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const switchFocusSchema = z.object({
  milestoneIds: z
    .array(z.string())
    .min(1)
    .describe(
      'IDs of milestones to focus on. Replaces the current focus entirely.',
    ),
});

export const switchFocusTool = tool(async () => 'Focus switched.', {
  name: 'switch_focus',
  description: `Switch the user's focus to specific milestone(s). This replaces the current focus — only the listed milestones will be focused. The focused milestones appear on the user's /today view. Load milestones first to get IDs. Not-started milestones will be automatically activated. Only completed milestones cannot be focused.`,
  schema: switchFocusSchema,
});
