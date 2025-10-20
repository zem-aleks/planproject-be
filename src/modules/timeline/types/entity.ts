import { TaskDetailsEntity } from '../../plans/tasks/types/entity';

export type TimelinePointEntity = {
  id: string;
  projectId: string;
  projectDay: number;
  comment: string;
  taskIds: string[];
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  tasks: TaskDetailsEntity[];
};
