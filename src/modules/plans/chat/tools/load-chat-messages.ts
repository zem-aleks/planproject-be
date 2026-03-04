import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const loadChatMessagesSchema = z.object({
  chatId: z.string().describe('The ID of the chat conversation to load.'),
});

export const loadChatMessagesTool = tool(async () => 'Chat messages loaded.', {
  name: 'load_chat_messages',
  description: `Load the full message history of a specific chat conversation. Use this after \`load_chats\` to read a conversation that may contain relevant context for the current discussion.`,
  schema: loadChatMessagesSchema,
});
