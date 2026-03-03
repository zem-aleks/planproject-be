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

import { proposePlanUpdateTool } from '../tools/propose-plan-update';
import { searchChatsTool } from '../tools/search-chats';
import { loadPhasesTool } from '../tools/load-phases';
import { loadMilestonesTool } from '../tools/load-milestones';
import { generatePlanTool } from '../tools/generate-plan';
import { ChatContext, ChatContextType } from '../types/entity';

const SOUL_CONTEXT_TYPES: ChatContextType[] = [
  'open_question',
  'workstream',
  'assumption',
  'decision',
];

function extractSoulEntityDetails(
  soul: ProjectSoul,
  context: ChatContext,
): string | undefined {
  const { type, entityId } = context;
  if (!entityId || !SOUL_CONTEXT_TYPES.includes(type)) return undefined;

  switch (type) {
    case 'open_question': {
      const item = soul.openQuestions.find((q) => q.topic === entityId);
      if (!item) return undefined;
      const lines = [`**Open Question: ${item.topic}**`];
      if (item.context) lines.push(`- Context: ${item.context}`);
      lines.push(`- Impact: ${item.impact}`);
      lines.push(`- Impact reason: ${item.impactReason}`);
      if (item.suggestedOptions?.length) {
        lines.push(`- Suggested options: ${item.suggestedOptions.join(', ')}`);
      }
      return lines.join('\n');
    }
    case 'workstream': {
      const item = soul.workstreams.find((w) => w.name === entityId);
      if (!item) return undefined;
      return [
        `**Workstream: ${item.name}**`,
        `- Description: ${item.description}`,
        `- Priority: ${item.priority}`,
      ].join('\n');
    }
    case 'assumption': {
      const item = soul.assumptions.find((a) => a.assumption === entityId);
      if (!item) return undefined;
      return [
        `**Assumption: ${item.assumption}**`,
        `- Reasoning: ${item.reasoning}`,
        `- Affected areas: ${item.affectedAreas.join(', ')}`,
      ].join('\n');
    }
    case 'decision': {
      const item = soul.decisions.find((d) => d.topic === entityId);
      if (!item) return undefined;
      const lines = [`**Decision: ${item.topic}**`, `- Chosen: ${item.chosen}`];
      if (item.rationale) lines.push(`- Rationale: ${item.rationale}`);
      return lines.join('\n');
    }
    default:
      return undefined;
  }
}

export type StreamChunkEvent = { type: 'chunk'; content: string };
export type StreamProposalEvent = {
  type: 'proposal';
  toolCallId: string;
  toolName: string;
  description: string;
  args: Record<string, unknown>;
};
export type StreamToolCallEvent = { type: 'tool_call'; name: string };
export type StreamProposalProgressEvent = {
  type: 'proposal_progress';
  stage: 'analyzing' | 'generating_changes';
};
export type StreamEvent =
  | StreamChunkEvent
  | StreamProposalEvent
  | StreamToolCallEvent
  | StreamProposalProgressEvent;

export type ToolExecutor = (
  name: string,
  args: Record<string, unknown>,
) => Promise<string>;

const MAX_TOOL_ROUNDS = 5;

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
    toolExecutor: ToolExecutor,
  ): AsyncGenerator<StreamEvent> {
    const model = getModel('claude-sonnet-4-6', 0.7).bindTools([
      proposePlanUpdateTool,
      searchChatsTool,
      loadPhasesTool,
      loadMilestonesTool,
      generatePlanTool,
    ]);

    const entityDetails = context
      ? extractSoulEntityDetails(soul, context)
      : undefined;

    const systemPrompt = buildChatSystemPrompt({
      soul: renderSoul(soul),
      context,
      entityDetails,
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
        yield { type: 'tool_call', name: toolCall.name };

        if (toolCall.name === 'propose_plan_update') {
          yield { type: 'proposal_progress', stage: 'analyzing' };
          yield { type: 'proposal_progress', stage: 'generating_changes' };
          yield {
            type: 'proposal',
            toolCallId: toolCall.id ?? '',
            toolName: toolCall.name,
            description: toolCall.args.description as string,
            args: toolCall.args as Record<string, unknown>,
          };

          langchainMessages.push(
            new ToolMessage({
              tool_call_id: toolCall.id ?? '',
              content:
                'Proposal submitted for user review. Continue your response.',
            }),
          );
        } else if (toolCall.name === 'generate_plan') {
          yield { type: 'proposal_progress', stage: 'analyzing' };
          yield { type: 'proposal_progress', stage: 'generating_changes' };
          yield {
            type: 'proposal',
            toolCallId: toolCall.id ?? '',
            toolName: toolCall.name,
            description: 'Generate the full project plan from the project soul',
            args: toolCall.args as Record<string, unknown>,
          };

          langchainMessages.push(
            new ToolMessage({
              tool_call_id: toolCall.id ?? '',
              content:
                'Plan generation proposal submitted for user review. Continue your response.',
            }),
          );
        } else {
          const result = await toolExecutor(
            toolCall.name,
            toolCall.args as Record<string, unknown>,
          );
          langchainMessages.push(
            new ToolMessage({
              tool_call_id: toolCall.id ?? '',
              content: result,
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
