import { MilestoneDetailsEntity } from '../../plans/milestones/types/entity';

export type TimelinePointEntity = {
  id: string;
  projectId: string;
  projectDay: number;
  comment: string;
  milestoneIds: string[];
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  milestones: MilestoneDetailsEntity[];
};
