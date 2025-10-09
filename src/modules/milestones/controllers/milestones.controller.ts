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
import { mapMilestoneToEntity } from '../mappers/mapMilestoneToEntity';
import { MilestonesService } from '../services/milestones.service';
import { PhasesService } from '../../phases/services/phases.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';
import { MilestonesAiService } from '../services/milestones-ai.service';
import { mapPhaseToEntityWithMilestones } from '../../phases/mappers/mapPhaseToEntity';

@Controller('milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(
    private readonly milestonesService: MilestonesService,
    private readonly milestonesAiService: MilestonesAiService,
    private readonly phasesService: PhasesService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get(':phaseId')
  async getMilestones(@Param('phaseId', ParseUUIDPipe) phaseId: string) {
    // TODO: vverify user
    const milestones = await this.milestonesService.getAll(phaseId);
    return milestones.map(mapMilestoneToEntity);
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

  @Delete(':milestoneId')
  async deleteMilestone(
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ) {
    // TODO: vverify user
    return this.milestonesService.softDelete(milestoneId);
  }
}
