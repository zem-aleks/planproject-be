import { PhaseEntity } from '../../phases/types/entity';

export type MilestoneStep = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
};

export type MilestoneEntity = {
  id: string;
  phaseId: string;
  projectId: string;
  title: string;
  description: string;
  definitionOfDone: string;
  daysNeeded: number;
  usefulResources: string | null;
  steps: MilestoneStep[];
  context: string | null;
  focused: boolean;
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

export type MilestoneDetailsEntity = MilestoneEntity & {
  // tasks: TaskEntity[];
  phase: PhaseEntity;
};
