import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from '@langchain/core/messages';

export type AiChatMessage = SystemMessage | HumanMessage | AIMessage;
