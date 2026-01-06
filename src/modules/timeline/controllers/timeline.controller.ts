import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
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
import { mapMilestoneToEntityWithDetails } from '../../plans/milestones/mappers/mapMilestoneToEntity';
import { PlansService } from '../../plans/services/plans.service';
import { notReachable } from '../../../shared/utils/notReachable';

@Controller('timeline')
@UseGuards(JwtAuthGuard)
export class TimelineController {
  constructor(
    private readonly timelineService: TimelineService,
    private readonly plansService: PlansService,
    private readonly milestonesService: MilestonesService,
  ) {}

  @Post(':projectId/extend-today') async extendToday(
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

    if (!timelinePoint) {
      throw new BadRequestException({
        message: 'No existing timeline point found for this project day.',
        code: 'NO_ACTIVE_TASKS',
      });
    }

    const milestones = await this.milestonesService.getByIds(
      timelinePoint.milestoneIds,
    );
    const status = await this.plansService.activateNextMilestone(project);
    switch (status.type) {
      case 'noMilestonesToStart':
        throw new BadRequestException({
          message: 'Project is already completed',
          code: 'PROJECT_COMPLETED',
        });

      case 'success':
        return this.timelineService.updateTimelinePoint({
          project,
          timelinePoint,
          newMilestone: status.milestone,
          finishedMilestones: milestones,
        });

      default:
        return notReachable(status);
    }
  }

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

    if (activeMilestones.length <= 0) {
      const status = await this.plansService.activateNextMilestone(project);
      switch (status.type) {
        case 'noMilestonesToStart':
          throw new BadRequestException({
            message: 'Project is already completed',
            code: 'PROJECT_COMPLETED',
          });

        case 'success':
          activeMilestones.push({ ...status.milestone, phase: status.phase });
          break;

        default:
          return notReachable(status);
      }
    }

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
