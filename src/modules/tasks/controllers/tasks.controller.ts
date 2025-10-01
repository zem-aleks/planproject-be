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
import { TasksAiService } from '../services/tasks-ai.service';
import { MilestonesService } from '../../milestones/services/milestones.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly tasksAiService: TasksAiService,
    private readonly phasesService: PhasesService,
    private readonly projectsService: ProjectsService,
    private readonly milestonesService: MilestonesService,
  ) {}

  @Get(':milestoneId')
  async getTasks(@Param('milestoneId', ParseUUIDPipe) milestoneId: string) {
    // TODO: vverify user
    const tasks = await this.tasksService.getAll(milestoneId);
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
    const phases = await this.phasesService.getAll(project.id);
    const milestones = await this.milestonesService.getAll(phase.id);
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const { tasks } = await this.tasksAiService.generateMilestoneTasks({
      project,
      phase,
      phases,
      milestone,
      milestones,
    });

    const milestoneTasks = await this.tasksService.createMany(
      tasks.map((task) => ({
        ...task,
        milestoneId: milestone.id,
        phaseId: milestone.phaseId,
        projectId: phase.projectId,
        status: 'notStarted',
      })),
    );

    console.log(milestoneTasks);
    return milestoneTasks.map(mapTaskToEntity);
  }

  @Delete(':taskId')
  async deleteTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    // TODO: vverify user
    return this.tasksService.softDelete(taskId);
  }
}
