import { MilestoneEntity } from '../../milestones/types/entity';

export type PhaseEntity = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  minDaysNeeded: number;
  maxDaysNeeded: number;
  expertiseNeeded: string;
  timelineStartDay: number;
  timelineEndDay: number;
  status: PhaseStatus;
  completedAt: Date | null;
  startedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type PhaseEntityWithMilestones = PhaseEntity & {
  milestones: MilestoneEntity[];
};

export type PhaseStatus =
  | 'building'
  | 'notStarted'
  | 'inProgress'
  | 'completed';
