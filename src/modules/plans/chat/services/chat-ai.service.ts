import { Injectable } from '@nestjs/common';
import {
  AIMessage,
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { getModel } from '../../../ai/models/models';
import { ChatMessage } from '../entities/chat-message.entity';
import { ProjectSoul } from '../../projects/types/entity';
import { renderSoul } from '../../projects/helpers/renderSoul';
import {
  buildChatSystemPrompt,
  GENERATE_CHAT_NAME_PROMPT,
} from '../prompts/chat';

import { proposeSoulUpdateTool } from '../tools/propose-soul-update';
import { ChatContext } from '../types/entity';

export type StreamChunkEvent = { type: 'chunk'; content: string };
export type StreamProposalEvent = {
  type: 'proposal';
  toolCallId: string;
  description: string;
};
export type StreamEvent = StreamChunkEvent | StreamProposalEvent;

const MAX_TOOL_ROUNDS = 3;

function extractTextContent(content: unknown): string | null {
  if (typeof content === 'string') return content || null;
  if (Array.isArray(content)) {
    const text = content
      .filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text)
      .join('');
    return text || null;
  }
  return null;
}

@Injectable()
export class ChatAiService {
  async generateResponse(
    messages: ChatMessage[],
    soul: ProjectSoul,
  ): Promise<string> {
    const model = getModel('claude-sonnet-4-6', 0.7);

    const systemPrompt = buildChatSystemPrompt({
      soul: renderSoul(soul),
      context: null,
    });

    const langchainMessages = [
      new SystemMessage(systemPrompt),
      ...messages
        .filter((msg) => msg.content)
        .map((msg) =>
          msg.role === 'user'
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content),
        ),
    ];

    const response = await model.invoke(langchainMessages);
    return response.content as string;
  }

  async *streamResponseWithTools(
    messages: ChatMessage[],
    soul: ProjectSoul,
    context: ChatContext | null,
  ): AsyncGenerator<StreamEvent> {
    const model = getModel('claude-sonnet-4-6', 0.7).bindTools([
      proposeSoulUpdateTool,
    ]);

    const systemPrompt = buildChatSystemPrompt({
      soul: renderSoul(soul),
      context,
    });

    const langchainMessages: (
      | SystemMessage
      | HumanMessage
      | AIMessage
      | ToolMessage
    )[] = [
      new SystemMessage(systemPrompt),
      ...messages
        .filter((msg) => msg.content)
        .map((msg) =>
          msg.role === 'user'
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content),
        ),
    ];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      let accumulated: AIMessageChunk | null = null;

      const stream = await model.stream(langchainMessages);

      for await (const chunk of stream) {
        accumulated = accumulated ? accumulated.concat(chunk) : chunk;

        const text = extractTextContent(chunk.content);
        if (text) {
          yield { type: 'chunk', content: text };
        }
      }

      if (!accumulated) break;

      const toolCalls = accumulated.tool_calls ?? [];
      if (toolCalls.length === 0) break;

      langchainMessages.push(new AIMessage(accumulated));

      for (const toolCall of toolCalls) {
        if (toolCall.name === 'propose_soul_update') {
          yield {
            type: 'proposal',
            toolCallId: toolCall.id ?? '',
            description: toolCall.args.description as string,
          };

          langchainMessages.push(
            new ToolMessage({
              tool_call_id: toolCall.id ?? '',
              content:
                'Proposal submitted for user review. Continue your response.',
            }),
          );
        }
      }
    }
  }

  async generateChatName(messages: ChatMessage[]): Promise<string> {
    const model = getModel('gpt-4.1-nano', 0.7);

    const langchainMessages = [
      new SystemMessage(GENERATE_CHAT_NAME_PROMPT),
      ...messages.map((msg) =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content),
      ),
    ];

    const response = await model.invoke(langchainMessages);
    return (response.content as string).trim();
  }
}
