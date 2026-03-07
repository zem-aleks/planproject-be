import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const unlockSectionSchema = z.object({
  section: z
    .enum(['competitors', 'auditory'])
    .describe(
      'Which section to unlock: competitors analysis or auditory (audience) analysis.',
    ),
});

export const unlockSectionTool = tool(async () => 'Section unlocked.', {
  name: 'unlock_section',
  description: `Unlock a project section (competitors or auditory) that hasn't been activated yet. This triggers AI generation of the section's content. Use when the user asks to analyze competitors, explore the audience/market, or explicitly asks to unlock one of these sections.`,
  schema: unlockSectionSchema,
});
