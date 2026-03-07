import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const updateCompetitorsSchema = z.object({
  competitorId: z.string().describe('ID of the competitor to update'),
  field: z
    .enum([
      'title',
      'description',
      'whyCompetitor',
      'url',
      'usp',
      'usersStats',
      'experienceToReuse',
      'competitionRating',
    ])
    .describe('The field to update on the competitor'),
  value: z.string().describe('New value for the field'),
});

export const updateCompetitorsTool = tool(async () => 'Competitor updated.', {
  name: 'update_competitors',
  description: `Update a single field on a specific competitor. Load competitors first to get IDs. Use when the user wants to correct or improve competitor information.`,
  schema: updateCompetitorsSchema,
});
