import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const loadCompetitorsSchema = z.object({});

export const loadCompetitorsTool = tool(async () => 'Competitors loaded.', {
  name: 'load_competitors',
  description: `Load all competitors for the current project. Returns competitor names, descriptions, ratings, USPs, and other details. Use when the user asks about competitors or competitive landscape.`,
  schema: loadCompetitorsSchema,
});
