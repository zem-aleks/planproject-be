import { Injectable } from '@nestjs/common';
import { Shaping } from '../entities/shaping.entity';
import { getModel, ModelType } from '../../ai/models/models';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { z } from 'zod';
import { getLangchainMessages } from '../../ai/helpers/getLangchainMessages';

@Injectable()
export class ShapingAiService {
  async processShapingData(shaping: Shaping, modelType: ModelType) {
    const model = getModel(modelType, 0.5);
    const structuredModel = model.withStructuredOutput(
      z.object({
        followUpQuestion: z.string().describe('A short follow-up question'),
        followUpAnswers: z
          .array(
            z
              .string()
              .describe('A possible short answer to the follow-up question'),
          )
          .describe(
            'A list of possible answers to the follow-up question. Up to 3 options',
          ),
        assistantComment: z.string().describe('Assistant comment'),
        score: z
          .number()
          .describe(
            'A score from 0 to 100 indicating how well the user idea is described',
          ),
      }),
    );

    const langchainMessages = shaping.messages.map((m) => {
      if (m.role === 'user') {
        return new HumanMessage(`[user_input]${m.content}[end_of_user_input]`);
      }

      return new AIMessage(
        `Follow-up question: ${m.content}. Comment: ${m.comment}`,
      );
    });

    return structuredModel.invoke([
      new SystemMessage(
        `You are an AI assistant that helps people articulate their project idea clearly before planning begins.

Your goal is to deeply understand the IDEA itself — not to gather logistics or implementation details. Those come later.

1. Ask one follow-up question per turn to deepen understanding of the idea. Focus on:
   - What problem does this solve and why does it matter?
   - Who is this for and what does their life look like today?
   - What does the ideal outcome look like? What changes when this succeeds?
   - What makes this approach different or interesting?
   - What is the core insight or belief behind this idea?

2. Provide a score from 0 to 100 indicating how clearly the idea is understood. The score reflects idea clarity — NOT how many logistical details have been gathered. A well-articulated idea with zero technical details can score 100.

3. Go DEEPER into the idea's meaning, not BROADER into logistics. If the user says "an app for X," ask about the X, not about the app. Understand the domain, the people, the pain, the vision.

4. DO NOT actively ask about: timeline, budget, team size, technical stack, available resources, or implementation approach. If the user volunteers these details, acknowledge them and move on — but never probe for them. They will be discussed later during project planning.

5. Add helpful context to your questions — share a relevant angle, a consideration, or a reframing that helps the user think more clearly about their idea.

6. Follow-up questions must be short and easy to understand.

7. Never repeat questions. If the user gives a negative or empty answer, accept it and move on — that topic becomes an area for later exploration.

8. Once the score reaches 100, ask if the user wants to share any additional details, and mention that we can start the project planning process.

9. Be flexible. If the user gives a strong answer, accept it and advance the score. Don't force exploration of topics the user has already addressed well.

10. Suggest possible answers to the follow-up question. Keep them short — up to 3 options.

Current score: ${shaping.score}
Do not decrease the score. Every answer should keep or increase the score.

For the assistantComment field: provide a short, friendly, and fun comment (1 sentence) that encourages the user. Feel free to make kind jokes and puns. Once the score is 100, cheer and congratulate the user.

Current turn is ${shaping.messages.length + 1}.
Don't repeat questions or comments. Aim to finish in 5 turns maximum.
Since there are only 5 turns, focus every question on what matters most: understanding the idea itself.
`,
      ),
      ...langchainMessages,
    ]);
  }

  async summarizeShaping(shaping: Shaping) {
    const previousSummary =
      shaping.summaries.length > 0
        ? shaping.summaries[shaping.summaries.length - 1]
        : null;
    const model = getModel('gpt-4o-mini', 0.5);
    const structuredModel = model.withStructuredOutput(
      z.object({
        summary: z.string().describe('Idea summary. Markdown formatted'),
        improvements: z
          .string()
          .describe(
            'Additional information that can improve the shape of idea. Markdown formatted.',
          ),
      }),
    );

    return await structuredModel.invoke([
      new SystemMessage(
        `There is a conversation between user and an AI assistant about user's project idea.
Your goal is to extract the key information and all available facts from this conversation and summarize it.
It will be presented directly to the user to confirm good understanding of the idea.
Try to make it short but keep the quality. It must indicate all important facts and aspects of this idea. 

Improvements field is used to indicate gaps and topics that will help to make a shape of this idea more clear.
Put here most valuable and significant questions or suggestions that will help to analyze this idea and transform it into actionable roadmap.

${previousSummary ? `2 messages ago user got such summary: ${previousSummary.content}. Keep the structure and extend it if new input was provided` : ``}
`,
      ),
      ...getLangchainMessages(shaping.messages),
    ]);
  }

  async summarizeProjectDescription(shaping: Shaping) {
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
Suggest title and description for the project.
`,
      ),
      ...getLangchainMessages(shaping.messages),
    ]);
  }
}
