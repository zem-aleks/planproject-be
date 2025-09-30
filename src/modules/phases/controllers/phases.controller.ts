import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { mapPhaseToEntity } from '../mappers/mapPhaseToEntity';
import { PhasesService } from '../services/phases.service';
import { ProjectByIdPipe } from '../../projects/pipes/project-by-id.pipe';
import { Project } from '../../projects/entities/project.entity';

@Controller('phases')
@UseGuards(JwtAuthGuard)
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

  @Get(':projectId')
  async getPhases(@Param('projectId', ProjectByIdPipe) project: Project) {
    // TODO: vverify user
    const phases = await this.phasesService.getAll(project.id);
    return phases.map(mapPhaseToEntity);
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
