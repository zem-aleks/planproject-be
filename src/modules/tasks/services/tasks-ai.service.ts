import { Injectable } from '@nestjs/common';
import { getModel } from '../../ai/models/models';
import { z } from 'zod';
import { SystemMessage } from '@langchain/core/messages';
import { Phase } from '../../phases/entities/phase.entity';
import { Project } from '../../projects/entities/project.entity';
import { Milestone } from '../../milestones/entities/milestone.entity';

@Injectable()
export class TasksAiService {
  async generateMilestoneTasks({
    phase,
    phases,
    project,
    milestones,
    milestone,
  }: {
    phase: Phase;
    phases: Phase[];
    project: Project;
    milestones: Milestone[];
    milestone: Milestone;
  }) {
    const model = getModel('gpt-4o-mini', 0.5);
    const structuredModel = model.withStructuredOutput(
      z.object({
        tasks: z
          .array(
            z.object({
              title: z.string().describe('Task title'),
              description: z
                .string()
                .describe(
                  'Task detailed description that explains what needs to be done step by step. Markdown formatted',
                ),
              definitionOfDone: z
                .string()
                .describe(
                  'Definition of done for this task. When this task can be considered as done. Markdown formatted',
                ),
              usefulResources: z
                .string()
                .nullable()
                .describe(
                  'Useful resources for this task, links, articles, etc. References that can help to complete the task. Markdown formatted',
                ),
              examples: z
                .string()
                .nullable()
                .describe(
                  'Examples that can help to complete the task. Provide examples if applicable. Markdown formatted',
                ),
              orderIndex: z.number().describe('The order index of the task'),
            }),
          )
          .describe('A list of project milestone tasks'),
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

Here's a list of milestones for this phase in JSON format:
${JSON.stringify(milestones, null, 2)}

User is currently working on the milestone: ${milestone.title}.
Phase ID: ${milestone.id}
Phase description: ${milestone.description || 'no description'}
Definition of done: ${milestone.definitionOfDone}
Estimation on how many days needed to accomplish it: ${milestone.daysNeeded}

Your goal is to generate a list of tasks for this milestone.
Make sure the tasks are in logical order. Provide as much details as possible in the description so it's possible to understand what needs to be done step by step.
Provide additional resources and examples if applicable.
The task must be related to the milestone and phase goal.
It has to be feasible to complete all the tasks within the milestone time frame.
Make it specific and actionable, so it's clear what needs to be done to complete each task.
`,
      ),
    ]);
  }
}
