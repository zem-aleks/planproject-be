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
import { CompetitorsService } from '../services/competitors.service';
import { mapCompetitorToEntity } from '../mappers/mapCompetitorToEntity';
import { CompetitorsAiService } from '../services/competitors-ai.service';

@Controller('competitors')
@UseGuards(JwtAuthGuard)
export class CompetitorsController {
  constructor(
    private readonly competitorsService: CompetitorsService,
    private readonly competitorsAiService: CompetitorsAiService,
  ) {}

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

    const competitorsData =
      await this.competitorsAiService.generateCompetitorsContent({ project });

    const createdCompetitors = await this.competitorsService.createMany(
      competitorsData.map((competitorData) => ({
        ...competitorData,
        projectId: project.id,
      })),
    );

    return createdCompetitors.map(mapCompetitorToEntity);
  }
}
