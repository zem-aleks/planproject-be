import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import {
  mapPhaseToEntity,
  mapPhaseToEntityWithMilestones,
} from '../mappers/mapPhaseToEntity';
import { PhasesService } from '../services/phases.service';
import { Project } from '../../projects/entities/project.entity';
import { CustomRequest } from '../../../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../../../users/pipes/user.pipe';
import { User } from '@supabase/supabase-js';
import { PhaseAndProject, PhaseByIdPipe } from '../pipes/phase-by-id.pipe';
import { AuthUser } from '../../../../shared/decorators/auth.decorator';
import { PhasesAiService } from '../services/phases-ai.service';
import { getProjectDay } from '../../projects/helpers/getProjectDay';
import { ActiveProjectByIdPipe } from '../../projects/pipes/active-project-by-id.pipe';

@Controller('phases')
@UseGuards(JwtAuthGuard)
export class PhasesController {
  constructor(
    private readonly phasesService: PhasesService,
    private readonly phasesAiService: PhasesAiService,
  ) {}

  @Get(':projectId')
  async getPhases(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
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

    const updatedPhase = await this.phasesService.activate(
      phase,
      getProjectDay(project),
    );
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

    await this.phasesService.complete(phase.id, project);

    return mapPhaseToEntity({ ...phase, status: 'completed' });
  }

  @Delete(':phaseId')
  async deletePhase(
    @Param('phaseId', PhaseByIdPipe)
    { phase, project }: PhaseAndProject,
    @CustomRequest(UserPipe) user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }
    return this.phasesService.softDelete(phase.id);
  }

  @Put(':projectId')
  async modifyPhases(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @Body('message') message: string,
    @AuthUser() user: User,
  ) {
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message is required');
    }

    if (project.status !== 'analyzing') {
      throw new BadRequestException('Project is not in analyzing state');
    }

    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const existingPhases = await this.phasesService.getAll(project.id);
    const phasesMap = new Map(existingPhases.map((p) => [p.id, p]));
    const { projectPhases } = await this.phasesAiService.modifyProjectPhases({
      project,
      phases: existingPhases,
      modificationMessage: message,
    });

    const promises = existingPhases.map((phase) => {
      const toBeRemoved = !projectPhases.find((p) => p.id === phase.id);
      if (toBeRemoved) {
        return this.phasesService.softDelete(phase.id);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);

    const phases = await this.phasesService.createMany(
      projectPhases.map((phaseData) => {
        const existingPhase = phasesMap.get(phaseData.id || '');
        if (existingPhase) {
          return {
            ...existingPhase,
            title: phaseData.phaseTitle,
            description: phaseData.phaseDescription,
            minDaysNeeded: phaseData.minDaysNeeded,
            maxDaysNeeded: phaseData.maxDaysNeeded,
            expertiseNeeded: phaseData.expertiseNeeded,
            timelineStartDay: phaseData.timelineStartDay,
            timelineEndDay: phaseData.timelineEndDay,
            projectId: project.id,
            status: 'notStarted',
            startedAt: new Date(),
            completedAt: null,
          };
        }

        return {
          title: phaseData.phaseTitle,
          description: phaseData.phaseDescription,
          minDaysNeeded: phaseData.minDaysNeeded,
          maxDaysNeeded: phaseData.maxDaysNeeded,
          expertiseNeeded: phaseData.expertiseNeeded,
          timelineStartDay: phaseData.timelineStartDay,
          timelineEndDay: phaseData.timelineEndDay,
          projectId: project.id,
          status: 'building',
          startedAt: new Date(),
          completedAt: null,
        };
      }),
    );

    return phases.map(mapPhaseToEntity);
  }
}
