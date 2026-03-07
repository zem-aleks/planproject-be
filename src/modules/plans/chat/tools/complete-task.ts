import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const completeTaskSchema = z.object({
  taskId: z.string().describe('ID of the task to complete'),
  message: z
    .string()
    .describe('Completion summary — what was done and any notable outcomes'),
});

export const completeTaskTool = tool(async () => 'Task completed.', {
  name: 'complete_task',
  description: `Mark a task as completed. Use when the user confirms they've finished a task. Provide a brief summary of what was accomplished.`,
  schema: completeTaskSchema,
});
