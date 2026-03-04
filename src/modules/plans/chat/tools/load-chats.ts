import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const loadChatsSchema = z.object({});

export const loadChatsTool = tool(async () => 'Chats loaded.', {
  name: 'load_chats',
  description: `List all chat conversations in the current project with their names, context, and when they were created. Use this to discover relevant past conversations before loading their full messages.`,
  schema: loadChatsSchema,
});
