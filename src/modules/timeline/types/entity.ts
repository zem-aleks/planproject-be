import { MilestoneDetailsEntity } from '../../plans/milestones/types/entity';
import { PhaseEntity } from '../../plans/phases/types/entity';
import { ProjectEntity } from '../../plans/projects/types/entity';

export type TimelinePointEntity = {
  id: string;
  projectId: string;
  projectDay: number;
  createdAt: Date;
  updatedAt: Date;
  events: TimelineEventHydrated[];
};

export type TimelineEventMilestone =
  | {
      type: 'milestone.started';
      milestoneId: string;
      comment: string;
      startedAt: Date;
    }
  | {
      type: 'milestone.continue';
      milestoneId: string;
      comment: string;
      createdAt: Date;
    }
  | { type: 'milestone.completed'; milestoneId: string; completedAt: Date };

export type TimelineEventPhase =
  | { type: 'phase.started'; phaseId: string }
  | { type: 'phase.completed'; phaseId: string };

export type TimelineEventProject =
  | { type: 'project.started'; projectId: string }
  | { type: 'project.completed'; projectId: string };

export type TimelineEvent =
  | TimelineEventMilestone
  | TimelineEventPhase
  | TimelineEventProject;

export type TimelineEventHydrated =
  | (TimelineEventMilestone & { milestone: MilestoneDetailsEntity })
  | (TimelineEventPhase & { phase: PhaseEntity })
  | (TimelineEventProject & { project: ProjectEntity });

export const isTimelineEventMilestone = (
  event: TimelineEvent,
): event is TimelineEventMilestone => {
  return 'milestoneId' in event;
};
