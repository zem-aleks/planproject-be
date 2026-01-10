import { Injectable } from '@nestjs/common';
import { Project } from '../../plans/projects/entities/project.entity';
import { getModel } from '../../ai/models/models';
import { SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';

@Injectable()
export class AuditoryAiService {
  async generateAuditoryInfo({ project }: { project: Project }) {
    const model = getModel('gpt-4o-mini', 0.5);
    const structuredModel = model.withStructuredOutput(
      z
        .object({
          menPercentage: z
            .number()
            .describe(
              'Audience is divided between men and women. Approximately, how many percents of man includes this auditory?',
            ),
          ageSeparation: z
            .array(
              z.object({
                ageInterval: z
                  .string()
                  .describe('Age interval, e.g. 18-24 years old, etc'),
                percentage: z
                  .number()
                  .describe('Percentage of users in this age group'),
              }),
            )
            .describe(
              'Age groups with percentage of users. Focus on a few main groups. Others can be merged into age group: "others"',
            ),

          tam: z.string().describe('Total Addressable Market (TAM)'),
          sam: z.string().describe('Serviceable Addressable Market (SAM)'),
          som: z.string().describe('Serviceable Obtainable Market (SOM)'),
        })
        .describe(
          'All values can be not accurate, but try to find the most accurate or applicable information as possible',
        ),
    );
    const result = await structuredModel.invoke([
      new SystemMessage(
        `You're auditory researcher for projects.
User is working on the project ${project.title}. 
Description: ${project.description || 'no description'}
Essential project context: ${project.summary || 'no context provided'}

Your goal is to analyze potential auditory for this project.
`,
      ),
    ]);

    return result;
  }

  async generateAuditoryDetails({ project }: { project: Project }) {
    const model = getModel('gpt-4o-mini', 0.5);

    // mainSegments
    // characters

    // auditoryDemands
    // auditoryPains
    // differentiation
    // auditoryChannels

    const structuredModel = model.withStructuredOutput(
      z
        .object({
          auditoryDemands: z
            .string()
            .describe(
              'Auditory main demands for this project. Markdown formatted',
            ),
          auditoryPains: z
            .string()
            .describe(
              'Auditory main pains for this project. Markdown formatted',
            ),
          differentiation: z
            .string()
            .describe(
              'Potential points of differentiation. What can make a huge difference for auditory in comparison to other projects. Markdown formatted',
            ),
          auditoryChannels: z
            .string()
            .describe(
              'What channels can used to attract the auditory. Markdown formatted',
            ),

          mainSegments: z
            .array(
              z.object({
                title: z.string().describe('Segment title'),
                description: z
                  .string()
                  .describe('Segment description. Markdown formatted'),
                motivation: z
                  .string()
                  .describe('What motivates this segment of auditory'),
                pain: z.string().describe('What is the pain of this segment'),
              }),
            )
            .describe('Up to 5 main segments of auditory'),

          characters: z
            .array(
              z.object({
                title: z.string().describe('Short character title'),
                description: z
                  .string()
                  .describe('Character description. Markdown formatted'),
                usageScenario: z
                  .string()
                  .describe(
                    'What can be a scenario of usage of this character. Short example',
                  ),
              }),
            )
            .describe(
              'Up to 3 examples of characters of auditory for this project',
            ),
        })
        .describe(
          'All values can be not accurate, but try to find the most accurate or applicable information as possible',
        ),
    );
    const result = await structuredModel.invoke([
      new SystemMessage(
        `You're auditory researcher for projects.
User is working on the project ${project.title}. 
Description: ${project.description || 'no description'}
Essential project context: ${project.summary || 'no context provided'}

Your goal is to analyze potential auditory for this project.
`,
      ),
    ]);

    return result;
  }
}
