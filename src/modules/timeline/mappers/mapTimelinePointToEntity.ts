import { TimelinePoint } from '../entities/timeline-point.entity';
import { TimelinePointEntity } from '../types/entity';
import { MilestoneDetailsEntity } from '../../plans/milestones/types/entity';

export const mapTimelinePointToEntity = (
  item: TimelinePoint,
  milestones: MilestoneDetailsEntity[],
): TimelinePointEntity => {
  return {
    ...item,
    milestones,
  };
};
