import { Injectable } from '@nestjs/common';
import { Project } from '../../plans/projects/entities/project.entity';
import { getModel } from '../../ai/models/models';
import { SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';

@Injectable()
export class CompetitorsAiService {
  async generateCompetitorsContent({ project }: { project: Project }) {
    const model = getModel('gpt-4o-mini', 0.5);
    const structuredModel = model.withStructuredOutput(
      z.object({
        competitors: z
          .array(
            z.object({
              title: z
                .string()
                .describe(
                  'Competitor title or application name or company name',
                ),
              description: z.string().describe('Short competitor description'),
              whyCompetitor: z
                .string()
                .describe(
                  'Describe why this competitor is relevant and what makes it a competitor',
                ),
              url: z
                .string()
                .describe(
                  'URL to the competitor website, app or company website',
                )
                .nullable(),
              usp: z
                .string()
                .describe(
                  'Unique selling proposition of the competitor. What makes it unique and why it should be considered for the project.',
                )
                .nullable(),
              usersStats: z
                .string()
                .describe('Approximate number of users or downloads')
                .nullable(),
              experienceToReuse: z
                .string()
                .describe(
                  'What experience of this project, app or company can be reused',
                )
                .nullable(),
              competitionRating: z
                .number()
                .describe(
                  'Rate a competitor between 1 and 100. 1 means that it has almost nothing in common with user startup. 100 means an absolute competitor that has absolutely the same idea',
                ),
            }),
          )
          .describe('A list of competitors'),
      }),
    );
    const result = await structuredModel.invoke([
      new SystemMessage(
        `You're competitors researcher.
User is working on the project ${project.title}. 
Description: ${project.description || 'no description'}
Essential project context: ${project.summary || 'no context provided'}

Your goal is to analyze competitors who already implemented such idea or have similar features.
Provide up to 10 competitors that are similar to the project idea and with whom comparison could be helpful.
`,
      ),
    ]);

    return result.competitors;
  }
}
