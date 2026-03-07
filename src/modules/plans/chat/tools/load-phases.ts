import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const loadPhasesSchema = z.object({});

export const loadPhasesTool = tool(async () => 'Phases loaded.', {
  name: 'load_phases',
  description: `Load all phases of the current project with their status, timeline, and descriptions. Use this when the user asks about project phases, progress, timeline, or planning.`,
  schema: loadPhasesSchema,
});
