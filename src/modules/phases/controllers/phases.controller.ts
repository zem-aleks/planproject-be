import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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

@Controller('phases')
@UseGuards(JwtAuthGuard)
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

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
  async getPhase(@Param('phaseId', ParseUUIDPipe) phaseId: string) {
    // TODO: vverify user
    const phase = await this.phasesService.getOneByIdOrThrow(phaseId);
    return mapPhaseToEntity(phase);
  }

  @Delete(':phaseId')
  async deletePhase(@Param('phaseId', ParseUUIDPipe) phaseId: string) {
    // TODO: vverify user
    return this.phasesService.softDelete(phaseId);
  }
}
