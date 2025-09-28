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
  status: 'notStarted' | 'inProgress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};
