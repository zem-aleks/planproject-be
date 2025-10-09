import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { mapTaskToEntity } from '../mappers/mapTaskToEntity';
import { TasksService } from '../services/tasks.service';
import { PhasesService } from '../../phases/services/phases.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';
import { MilestonesService } from '../../milestones/services/milestones.service';
import { ProjectByIdPipe } from '../../projects/pipes/project-by-id.pipe';
import { Project } from '../../projects/entities/project.entity';
import { CustomRequest } from '../../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../../users/pipes/user.pipe';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,

    private readonly phasesService: PhasesService,
    private readonly projectsService: ProjectsService,
    private readonly milestonesService: MilestonesService,
  ) {}

  @Get(':milestoneId')
  async getTasks(@Param('milestoneId', ParseUUIDPipe) milestoneId: string) {
    // TODO: vverify user
    const tasks = await this.tasksService.getAllByMilestoneId(milestoneId);
    return tasks.map(mapTaskToEntity);
  }

  @Get('active/:projectId')
  async getActiveTasks(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @CustomRequest(UserPipe) user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const tasks = await this.tasksService.getAllByProjectId(project.id);
    return tasks.map(mapTaskToEntity);
  }

  @Post(':milestoneId')
  async createTasks(
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @AuthUser() user: User,
  ) {
    const milestone =
      await this.milestonesService.getOneByIdOtThrow(milestoneId);
    const phase = await this.phasesService.getOneByIdOrThrow(milestone.phaseId);
    const project = await this.projectsService.getOneByIdOrThrow(
      phase.projectId,
    );

    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const tasks = await this.tasksService.generateTasksForMilestone({
      project,
      phase,
      milestone,
    });

    return tasks.map(mapTaskToEntity);
  }

  @Delete(':taskId')
  async deleteTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    // TODO: vverify user
    return this.tasksService.softDelete(taskId);
  }
}
