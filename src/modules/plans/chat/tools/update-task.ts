import { z } from 'zod';
import { tool } from '@langchain/core/tools';

const updateTaskSchema = z.object({
  taskId: z.string().describe('ID of the task to update'),
  field: z
    .enum([
      'title',
      'description',
      'definitionOfDone',
      'usefulResources',
      'examples',
    ])
    .describe('The field to update on the task'),
  value: z.string().describe('New value for the field'),
});

export const updateTaskTool = tool(async () => 'Task updated.', {
  name: 'update_task',
  description: `Update a single field on a task. Load milestones/tasks first to get the task ID. Use when the user wants to refine task details.`,
  schema: updateTaskSchema,
});
