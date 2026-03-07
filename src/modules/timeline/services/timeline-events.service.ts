import { Injectable } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { TimelineEvent, TimelineEventHydrated } from '../types/entity';
import { notReachable } from '../../../shared/utils/notReachable';
import { MilestonesService } from '../../plans/milestones/services/milestones.service';
import { mapMilestoneToEntityWithDetails } from '../../plans/milestones/mappers/mapMilestoneToEntity';
import { PhasesService } from '../../plans/phases/services/phases.service';
import { mapPhaseToEntity } from '../../plans/phases/mappers/mapPhaseToEntity';
import { ProjectsService } from '../../plans/projects/services/projects.service';
import { mapProjectToEntity } from '../../plans/projects/mappers/mapProjectToEntity';
import { SupabaseStorageService } from '../../supabase/supabase-storage.service';

@Injectable()
export class TimelineEventsService {
  readonly logoPath: string;

  constructor(
    private readonly timelineService: TimelineService,
    private readonly milestonesService: MilestonesService,
    private readonly phasesService: PhasesService,
    private readonly projectsService: ProjectsService,
    private readonly storageService: SupabaseStorageService,
  ) {
    this.logoPath = this.storageService.getBucketUrl('logo') + '/';
  }

  async hydrateEvents(
    events: TimelineEvent[],
  ): Promise<TimelineEventHydrated[]> {
    const promises: Promise<TimelineEventHydrated | null>[] = events.map(
      async (event) => {
        switch (event.type) {
          case 'milestone.started':
          case 'milestone.continue':
          case 'milestone.completed':
            const milestone = await this.milestonesService.getOneByIdWithPhase(
              event.milestoneId,
            );

            if (!milestone) {
              // TODO: we should trigger logger here, because milestone disappeared for some reason
              return null;
            }

            return {
              ...event,
              milestone: mapMilestoneToEntityWithDetails(milestone),
            };

          case 'phase.completed':
          case 'phase.started':
            const phase = await this.phasesService.getOneById(event.phaseId);

            if (!phase) {
              // TODO: we should trigger logger here, because milestone disappeared for some reason
              return null;
            }

            return {
              ...event,
              phase: mapPhaseToEntity(phase),
            };

          case 'project.started':
          case 'project.completed':
            const project = await this.projectsService.getOneById(
              event.projectId,
            );

            if (!project) {
              // TODO: we should trigger logger here, because milestone disappeared for some reason
              return null;
            }
            return {
              ...event,
              project: mapProjectToEntity(project, this.logoPath),
            };

          case 'focus.changed':
          case 'soul.updated':
          case 'chat.created':
          case 'task.completed':
            return event;

          default:
            return notReachable(event);
        }
      },
    );

    const hydratedEvents = await Promise.all(promises);
    return hydratedEvents.filter((e) => e !== null) as TimelineEventHydrated[];
  }

  async registerEvents({
    projectId,
    projectDay,
    events,
  }: {
    projectId: string;
    projectDay: number;
    events: TimelineEvent[];
  }) {
    const point = await this.timelineService.getTimelinePointOrCreate({
      projectId,
      projectDay,
    });

    return this.timelineService.updatePartial(point.id, {
      events: [...point.events, ...events],
    });
  }
}
