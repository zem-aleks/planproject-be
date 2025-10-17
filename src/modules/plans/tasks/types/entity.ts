import { MilestoneEntity } from '../../milestones/types/entity';

export type TaskEntity = {
  id: string;
  phaseId: string;
  milestoneId: string;
  projectId: string;
  title: string;
  description: string;
  definitionOfDone: string;
  usefulResources: string | null;
  examples: string | null;
  completeMessage: string | null;
  day: number;
  orderIndex: number;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  completedAt: Date | null;
};

export type TaskStatus = 'notStarted' | 'inProgress' | 'completed';

export type TaskDetailsEntity = TaskEntity & {
  milestone: MilestoneEntity;
};
