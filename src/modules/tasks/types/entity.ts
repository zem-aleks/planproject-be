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
  orderIndex: number;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type TaskStatus = 'notStarted' | 'inProgress' | 'completed';
