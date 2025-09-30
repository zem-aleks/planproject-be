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
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type PhaseStatus =
  | 'building'
  | 'notStarted'
  | 'inProgress'
  | 'completed';
