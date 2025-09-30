import { Injectable } from '@nestjs/common';
import { getModel } from '../../ai/models/models';
import { z } from 'zod';
import { SystemMessage } from '@langchain/core/messages';
import { Phase } from '../../phases/entities/phase.entity';
import { Project } from '../../projects/entities/project.entity';

@Injectable()
export class MilestonesAiService {
  async generatePhaseMilestones({
    phase,
    phases,
    project,
  }: {
    phase: Phase;
    phases: Phase[];
    project: Project;
  }) {
    const model = getModel('gpt-4.1-mini', 0.5);
    const structuredModel = model.withStructuredOutput(
      z.object({
        milestones: z
          .array(
            z.object({
              title: z.string().describe('Milestone title'),
              description: z.string().describe('Milestone description'),
              daysNeeded: z
                .number()
                .describe(
                  'How many days are needed to complete this milestone',
                ),
              definitionOfDone: z
                .string()
                .describe(
                  'Definition of done for this milestone. When this milestone can be considered as done',
                ),
              orderIndex: z
                .number()
                .describe('The order index of the milestone'),
            }),
          )
          .describe('A list of project phase milestones'),
      }),
    );

    return structuredModel.invoke([
      new SystemMessage(
        `You are an AI assistant that helps to build a project plan.
User is working on the project ${project.title}. 
Description: ${project.description || 'no description'}
Essential project context: ${project.summary || 'no context provided'}

Here's a list of all project phases in JSON format:
${JSON.stringify(phases, null, 2)}

User is currently working on the phase: ${phase.title}.
Phase ID: ${phase.id}
Phase description: ${phase.description || 'no description'}
Minimal time estimation in days: ${phase.minDaysNeeded}
Maximal time estimation in days: ${phase.maxDaysNeeded}
Expertise needed to complete this phase: ${phase.expertiseNeeded}
Timeline start day: ${phase.timelineStartDay}
Timeline end day: ${phase.timelineEndDay}

Your task is to generate a list of milestones for this phase.
A milestone is a significant point or event in a project. 
Milestones help to break down the project into manageable parts and track progress.

For each milestone, provide:
- title: A concise title for the milestone
- description: A brief description of the milestone
- daysNeeded: An estimation of how many days are needed to complete this milestone
- definitionOfDone: A clear definition of done for this milestone. When can this milestone be considered as done
- orderIndex: The order index of the milestone within the phase

Provide at least 3 milestones for this phase.
Make sure that the total daysNeeded for all milestones does not exceed ${phase.maxDaysNeeded} days.
Make sure that the total daysNeeded for all milestones is at least ${phase.minDaysNeeded} days.
`,
      ),
    ]);
  }
}
