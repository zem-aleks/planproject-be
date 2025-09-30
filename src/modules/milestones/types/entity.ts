export type MilestoneEntity = {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  definitionOfDone: string;
  daysNeeded: number;
  orderIndex: number;
  status: MilestoneStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type MilestoneStatus = 'notStarted' | 'inProgress' | 'completed';
