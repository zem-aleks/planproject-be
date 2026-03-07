import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const searchChatsSchema = z.object({
  query: z
    .string()
    .describe(
      'Search query to find relevant past chat messages in this project. Use keywords or phrases the user or assistant might have used.',
    ),
});

export const searchChatsTool = tool(async () => 'Search executed.', {
  name: 'search_chats',
  description: `Search across all chat messages in the current project. Use this when the user references a past conversation, asks "did we discuss…", or when you need to recall earlier context about a topic. Returns matching messages with their chat name and timestamp.`,
  schema: searchChatsSchema,
});
