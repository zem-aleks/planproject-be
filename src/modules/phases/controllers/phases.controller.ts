import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import {
  mapPhaseToEntity,
  mapPhaseToEntityWithMilestones,
} from '../mappers/mapPhaseToEntity';
import { PhasesService } from '../services/phases.service';
import { ProjectByIdPipe } from '../../projects/pipes/project-by-id.pipe';
import { Project } from '../../projects/entities/project.entity';
import { CustomRequest } from '../../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../../users/pipes/user.pipe';
import { User } from '@supabase/supabase-js';
import { PhaseAndProject, PhaseByIdPipe } from '../pipes/phase-by-id.pipe';

@Controller('phases')
@UseGuards(JwtAuthGuard)
export class PhasesController {
  constructor(
    private readonly phasesService: PhasesService,
    // private readonly projectsService: ProjectsService,
  ) {}

  @Get(':projectId')
  async getPhases(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @CustomRequest(UserPipe) user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('You do not have access to this project');
    }
    const phases = await this.phasesService.getAllWithMilestones(project.id);
    return phases.map(mapPhaseToEntityWithMilestones);
  }

  @Get('view/:phaseId')
  async getPhase(
    @Param('phaseId', PhaseByIdPipe)
    { phase, project }: PhaseAndProject,
    @CustomRequest(UserPipe) user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }
    return mapPhaseToEntity(phase);
  }

  @Patch(':phaseId')
  async startPhase(
    @Param('phaseId', PhaseByIdPipe)
    { phase, project }: PhaseAndProject,
    @CustomRequest(UserPipe) user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    if (project.status !== 'active') {
      throw new BadRequestException('Project is not started yet');
    }

    if (phase.status !== 'notStarted') {
      throw new NotFoundException('Phase is already started');
    }

    const updatedPhase = await this.phasesService.update({
      ...phase,
      status: 'inProgress',
      startedAt: new Date(),
    });
    return mapPhaseToEntity(updatedPhase);
  }

  @Patch(':phaseId/complete')
  async completePhase(
    @Param('phaseId', PhaseByIdPipe)
    { phase, project }: PhaseAndProject,
    @CustomRequest(UserPipe) user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    if (project.status !== 'active') {
      throw new BadRequestException('Project is not started yet');
    }

    if (phase.status !== 'inProgress') {
      throw new NotFoundException('Phase is not started');
    }

    const updatedPhase = await this.phasesService.update({
      ...phase,
      status: 'completed',
      completedAt: new Date(),
    });

    return mapPhaseToEntity(updatedPhase);
  }

  @Delete(':phaseId')
  async deletePhase(@Param('phaseId', ParseUUIDPipe) phaseId: string) {
    // TODO: vverify user
    return this.phasesService.softDelete(phaseId);
  }
}
