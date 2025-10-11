import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { mapMilestoneToEntity } from '../mappers/mapMilestoneToEntity';
import { MilestonesService } from '../services/milestones.service';
import { PhasesService } from '../../phases/services/phases.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';
import { MilestonesAiService } from '../services/milestones-ai.service';
import {
  mapPhaseToEntity,
  mapPhaseToEntityWithMilestones,
} from '../../phases/mappers/mapPhaseToEntity';
import { mapTaskToEntity } from '../../tasks/mappers/mapTaskToEntity';
import { TasksService } from '../../tasks/services/tasks.service';
import {
  PhaseAndProject,
  PhaseByIdPipe,
} from '../../phases/pipes/phase-by-id.pipe';
import { CustomRequest } from '../../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../../users/pipes/user.pipe';
import { MilestoneWithTasksEntity } from '../types/entity';

@Controller('milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(
    private readonly milestonesService: MilestonesService,
    private readonly milestonesAiService: MilestonesAiService,
    private readonly phasesService: PhasesService,
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
  ) {}

  @Get('phase/:phaseId')
  async getMilestones(
    @Param('phaseId', PhaseByIdPipe) { phase, project }: PhaseAndProject,
    @CustomRequest(UserPipe) user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }
    const milestones = await this.milestonesService.getAll(phase.id);
    return milestones.map(mapMilestoneToEntity);
  }

  @Get(':milestoneId')
  async getMilestone(
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @CustomRequest(UserPipe) user: User,
  ): Promise<MilestoneWithTasksEntity> {
    const milestone =
      await this.milestonesService.getOneByIdOtThrow(milestoneId);

    const project = await this.projectsService.getOneByIdOrThrow(
      milestone.projectId,
    );

    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const phase = await this.phasesService.getOneByIdOrThrow(milestone.phaseId);
    const tasks = await this.tasksService.getAllByMilestoneId(milestone.id);
    return {
      ...mapMilestoneToEntity(milestone),
      tasks: tasks.map(mapTaskToEntity),
      phase: mapPhaseToEntity(phase),
    };
  }

  @Post(':phaseId')
  async createMilestones(
    @Param('phaseId', ParseUUIDPipe) phaseId: string,
    @AuthUser() user: User,
  ) {
    const phase = await this.phasesService.getOneByIdOrThrow(phaseId);
    const project = await this.projectsService.getOneByIdOrThrow(
      phase.projectId,
    );
    const phases = await this.phasesService.getAll(project.id);
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const { milestones } =
      await this.milestonesAiService.generatePhaseMilestones({
        project,
        phase,
        phases,
      });

    const phaseMilestones = await this.milestonesService.createMany(
      milestones.map((milestone) => ({
        ...milestone,
        phaseId: phase.id,
        projectId: project.id,
        userId: user.id,
        status: 'notStarted',
        startedAt: new Date(),
      })),
    );

    const updatedPhase = await this.phasesService.update({
      ...phase,
      status: 'notStarted',
    });

    return mapPhaseToEntityWithMilestones({
      ...updatedPhase,
      milestones: phaseMilestones,
    });
  }

  @Patch(':milestoneId')
  async startMilestone(
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @AuthUser() user: User,
  ) {
    const milestone =
      await this.milestonesService.getOneByIdOtThrow(milestoneId);

    if (milestone.status !== 'notStarted') {
      throw new BadRequestException('Milestone already started');
    }

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

    const updatedMilestone = await this.milestonesService.update({
      ...milestone,
      status: 'inProgress',
      startedAt: new Date(),
    });

    return {
      ...updatedMilestone,
      tasks: tasks.map(mapTaskToEntity),
    };
  }

  @Delete(':milestoneId')
  async deleteMilestone(
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ) {
    // TODO: vverify user
    return this.milestonesService.softDelete(milestoneId);
  }
}
