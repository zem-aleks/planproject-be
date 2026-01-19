import { TimelinePoint } from '../entities/timeline-point.entity';
import { TimelineEventHydrated, TimelinePointEntity } from '../types/entity';

export const mapTimelinePointToEntity = (
  item: TimelinePoint,
  events: TimelineEventHydrated[],
): TimelinePointEntity => {
  return {
    ...item,
    events,
  };
};
