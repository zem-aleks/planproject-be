import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const updateAuditorySchema = z.object({
  field: z
    .enum([
      'tam',
      'sam',
      'som',
      'auditoryDemands',
      'auditoryPains',
      'differentiation',
      'auditoryChannels',
    ])
    .describe('The field to update on the auditory analysis'),
  value: z
    .string()
    .describe('New value for the field (markdown supported for text fields)'),
});

export const updateAuditoryTool = tool(async () => 'Auditory updated.', {
  name: 'update_auditory',
  description: `Update a single field on the auditory (audience) analysis. Load auditory first to see current values. Use when the user wants to correct or improve audience analysis information.`,
  schema: updateAuditorySchema,
});
