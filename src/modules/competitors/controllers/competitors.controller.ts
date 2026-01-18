import {
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
import { CompetitorsService } from '../services/competitors.service';
import { mapCompetitorToEntity } from '../mappers/mapCompetitorToEntity';

@Controller('competitors')
@UseGuards(JwtAuthGuard)
export class CompetitorsController {
  constructor(private readonly competitorsService: CompetitorsService) {}

  @Get(':projectId')
  async getCompetitors(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const competitors = await this.competitorsService.getAll(project.id);
    if (competitors.length > 0) {
      return competitors.map(mapCompetitorToEntity);
    }

    const createdCompetitors =
      await this.competitorsService.generateForProject(project);

    return createdCompetitors.map(mapCompetitorToEntity);
  }
}
