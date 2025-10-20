import { TimelinePoint } from '../entities/timeline-point.entity';
import { TimelinePointEntity } from '../types/entity';
import { TaskDetailsEntity } from '../../plans/tasks/types/entity';

export const mapTimelinePointToEntity = (
  item: TimelinePoint,
  tasks: TaskDetailsEntity[],
): TimelinePointEntity => {
  return {
    ...item,
    tasks,
  };
};
