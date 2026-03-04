import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const loadAuditorySchema = z.object({});

export const loadAuditoryTool = tool(async () => 'Auditory loaded.', {
  name: 'load_auditory',
  description: `Load the auditory (audience) analysis for the current project. Returns market sizing (TAM/SAM/SOM), audience demands, pains, differentiation, and channels. Use when the user asks about their target audience or market.`,
  schema: loadAuditorySchema,
});
