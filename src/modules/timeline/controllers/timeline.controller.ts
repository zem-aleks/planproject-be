import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';
import { ProjectByIdPipe } from '../../plans/projects/pipes/project-by-id.pipe';
import { Project } from '../../plans/projects/entities/project.entity';
import * as dayjs from 'dayjs';
import { TimelineService } from '../services/timeline.service';
import { mapTimelinePointToEntity } from '../mappers/mapTimelinePointToEntity';
import { MilestonesService } from '../../plans/milestones/services/milestones.service';
import { PhasesService } from '../../plans/phases/services/phases.service';
import { mapMilestoneToEntityWithDetails } from '../../plans/milestones/mappers/mapMilestoneToEntity';

@Controller('timeline')
@UseGuards(JwtAuthGuard)
export class TimelineController {
  constructor(
    private readonly timelineService: TimelineService,
    // private readonly tasksService: TasksService,
    private readonly phasesService: PhasesService,
    private readonly milestonesService: MilestonesService,
  ) {}

  @Get(':projectId/today')
  async getToday(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    if (project.status === 'completed') {
      throw new BadRequestException({
        message: 'Project is already completed',
        code: 'PROJECT_COMPLETED',
      });
    }

    const projectDay = dayjs().diff(project.startedAt, 'days') + 1;
    const timelinePoint = await this.timelineService.getTimelinePoint({
      projectId: project.id,
      projectDay,
    });

    if (timelinePoint) {
      const timelineMilestones = await this.milestonesService.getByIds(
        timelinePoint.milestoneIds,
      );
      return mapTimelinePointToEntity(
        timelinePoint,
        timelineMilestones.map(mapMilestoneToEntityWithDetails),
      );
    }

    const activeMilestones = await this.milestonesService.getActiveMilestones(
      project.id,
    );

    if (!activeMilestones.length) {
      throw new BadRequestException({
        message: 'No active tasks found for the project',
        code: 'NO_ACTIVE_TASKS',
      });
    }

    // const activePhases = await this.phasesService.getActiveWithMilestones(
    //   project.id,
    // );
    //
    // if (!activePhases.length) {
    //   const notStartedPhase = await this.phasesService.getFirstNotStarted(
    //     project.id,
    //   );
    //
    //   if (!notStartedPhase) {
    //     throw new BadRequestException({
    //       message: 'No active phases found for the project',
    //       code: 'NO_ACTIVE_PHASES',
    //     });
    //   }
    //
    //   const startedPhase = await this.phasesService.startPhase(notStartedPhase);
    // }

    const newTimelinePoint = await this.timelineService.generateTimelinePoint({
      project,
      projectDay,
      activeMilestones,
    });

    if (!newTimelinePoint) {
      throw new BadRequestException({
        message: 'No active tasks found for the project',
        code: 'NO_ACTIVE_TASKS',
      });
    }

    return mapTimelinePointToEntity(
      newTimelinePoint,
      activeMilestones.map(mapMilestoneToEntityWithDetails),
    );
  }
}
