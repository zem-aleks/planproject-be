import { TaskEntity } from '../../tasks/types/entity';
import { PhaseEntity } from '../../phases/types/entity';

export type MilestoneEntity = {
  id: string;
  phaseId: string;
  projectId: string;
  userId: string;
  title: string;
  description: string;
  definitionOfDone: string;
  daysNeeded: number;
  orderIndex: number;
  status: MilestoneStatus;
  completeMessage: string | null;
  completedAt: Date | null;
  startedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type MilestoneStatus = 'notStarted' | 'inProgress' | 'completed';

export type MilestoneWithTasksEntity = MilestoneEntity & {
  tasks: TaskEntity[];
  phase: PhaseEntity;
};
