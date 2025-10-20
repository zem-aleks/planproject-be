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
import { TasksService } from '../../plans/tasks/services/tasks.service';

@Controller('timeline')
@UseGuards(JwtAuthGuard)
export class TimelineController {
  constructor(
    private readonly timelineService: TimelineService,
    private readonly tasksService: TasksService,
  ) {}

  @Get(':projectId/today')
  async getToday(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const projectDay = dayjs().diff(project.startedAt, 'days') + 1;
    const timelinePoint = await this.timelineService.getTimelinePoint({
      projectId: project.id,
      projectDay,
    });
    const activeTasks = await this.tasksService.getNotCompletedByProjectId(
      project.id,
    );

    if (timelinePoint) {
      return mapTimelinePointToEntity(
        timelinePoint,
        activeTasks.filter((t) => timelinePoint.taskIds.includes(t.id)),
      );
    }

    if (!activeTasks.length) {
      throw new BadRequestException({
        message: 'No active tasks found for the project',
        code: 'NO_ACTIVE_TASKS',
      });
    }

    const newTimelinePoint = await this.timelineService.generateTimelinePoint({
      project,
      projectDay,
      activeTasks,
    });

    if (!newTimelinePoint) {
      throw new BadRequestException({
        message: 'No active tasks found for the project',
        code: 'NO_ACTIVE_TASKS',
      });
    }

    return mapTimelinePointToEntity(
      newTimelinePoint,
      activeTasks.filter((t) => newTimelinePoint.taskIds.includes(t.id)),
    );
  }
}
