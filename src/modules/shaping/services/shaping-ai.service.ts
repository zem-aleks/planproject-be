import { Injectable } from '@nestjs/common';
import { Shaping } from '../entities/shaping.entity';
import { getModel } from '../../ai/models/models';
import { SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { getLangchainMessages } from '../../ai/helpers/getLangchainMessages';

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
}
