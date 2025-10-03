import { Injectable } from '@nestjs/common';
import { Shaping } from '../entities/shaping.entity';
import { getModel } from '../../ai/models/models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { getLangchainMessages } from '../../ai/helpers/getLangchainMessages';
import { Project } from '../../projects/entities/project.entity';

@Injectable()
export class ShapingAiService {
  async processShapingData(shaping: Shaping) {
    const model = getModel('gpt-4.1-mini', 0.5);
    const structuredModel = model.withStructuredOutput(
      z.object({
        followUpQuestion: z.string().describe('A short follow-up question'),
        score: z
          .number()
          .describe(
            'A score from 0 to 100 indicating how well the user idea is described',
          ),
      }),
    );

    return structuredModel.invoke([
      new SystemMessage(
        `You are an AI assistant that helps to shape user idea into a clear path on how to make a project.
User provides details about their idea, and you need to:
1. Ask a follow-up question to clarify the idea and make it clearer.
2. Provide a score from 0 to 100 indicating how well the user idea is described.
3. Take a look at the idea from different perspectives: technical feasibility, market demand, user experience, and potential challenges.
4. Provide constructive feedback on how to improve the idea description.
5. Help to identify any gaps or missing information that could be crucial for the project planning.
6. Consider that project planing may require details about the available resources and timeline
7. Remember that the goal is to help the user refine their idea and make it more actionable for project planning.
8. User may not know an answers to all your questions. You still can increase the score by providing such answer. It means that the project roadmap will require additional research and planning for this part.
9. Never repeat the questions! Negative or empty answers means that it's additional topic for investigation during the project planning phase.
10. Once the score reaches 100, ask if a user wants to share some additional details that could help to make the idea even clearer. Also mention that we can start the process of project planing. 

Current score: ${shaping.score}
Do not decrease the score. Every answer should be aimed to keep or increase the score. 
`,
      ),
      ...getLangchainMessages(shaping.messages),
    ]);
  }

  async summarizeProjectPhases(project: Project) {
    const model = getModel('gpt-4.1-mini', 0.5);
    const structuredModel = model.withStructuredOutput(
      z.object({
        projectPhases: z
          .array(
            z.object({
              phaseTitle: z.string().describe('Title of the project phase'),
              phaseDescription: z
                .string()
                .describe('Description of the project phase'),
              minDaysNeeded: z
                .number()
                .describe('Minimal time estimation in days'),
              maxDaysNeeded: z
                .number()
                .describe('Maximal time estimation in days'),
              expertiseNeeded: z
                .string()
                .describe(
                  'Expertise needed to complete this phase. Short comma-separated list',
                ),
              timelineStartDay: z
                .number()
                .describe(
                  `The start day of the phase in relation to the project start date. Day 1 is the project start date. Consider that some phases can run in parallel and some phases can't start before the previous phase is finished`,
                ),
              timelineEndDay: z
                .number()
                .describe(
                  'The end day of the phase in relation to the project start date. Day 1 is the project start date. Use average estimation between min and max estimations for this calculation',
                ),
            }),
          )
          .describe('A list of project phases with titles and descriptions'),
      }),
    );

    return structuredModel.invoke([
      new SystemMessage(
        `You are an AI assistant that helps to build a project plan.
You need to transform all provided data into structured project plan with clear phases.

The plan should be broken down into clear phases, each with its own title and description.
For each phase, provide a minimal and maximal time estimation in days, as well as a short comma-separated list of expertise needed to complete the phase.
Remember that the goal is to create a clear and actionable project plan that can be used for further planning and execution.
`,
      ),
      new HumanMessage(`Project title: ${project.title}
Project description: ${project.description || 'no description'}
Project idea summary: ${project.summary || 'no summary provided'}
`),
    ]);
  }

  async summarizeProjectDescription(shaping: Shaping, project: Project) {
    const model = getModel('gpt-4o-mini', 0.5);
    const structuredModel = model.withStructuredOutput(
      z.object({
        projectTitle: z.string().describe('A concise title for the project'),
        projectDescription: z
          .string()
          .describe('A brief description of the project idea'),
        projectSummary: z
          .string()
          .describe('A concise summary of the project idea'),
      }),
    );

    return structuredModel.invoke([
      new SystemMessage(
        `There is a conversation between a user and an AI assistant about a project idea.
Your goal to extract the key information and all available facts from this conversation and summarize it.
This summary will be used by LLM for further project planning. Optimize it for that.
Suggest title and description for the project. User provided such title and description:

title: ${project.title}
description: ${project.description || 'no initial description provided'}
`,
      ),
      ...getLangchainMessages(shaping.messages),
    ]);
  }
}
