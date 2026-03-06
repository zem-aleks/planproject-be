import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const loadTasksSchema = z.object({
  milestoneId: z.string().describe('ID of the milestone to load tasks for'),
});

export const loadTasksTool = tool(async () => 'Tasks loaded.', {
  name: 'load_tasks',
  description: `Load tasks for a specific milestone. Use when the user asks about tasks, wants to complete or update a task, or needs task details. Returns task IDs, titles, statuses, and descriptions.`,
  schema: loadTasksSchema,
});
