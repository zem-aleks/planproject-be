import {
  Controller,
  Get,
  Param,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { Project } from '../../plans/projects/entities/project.entity';
import { CompetitorsService } from '../services/competitors.service';
import { mapCompetitorToEntity } from '../mappers/mapCompetitorToEntity';
import { ActiveProjectByIdPipe } from '../../plans/projects/pipes/active-project-by-id.pipe';
import { CustomRequest } from '../../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../../users/pipes/user.pipe';
import { User } from '../../users/entities/user.entity';

@Controller('competitors')
@UseGuards(JwtAuthGuard)
export class CompetitorsController {
  constructor(private readonly competitorsService: CompetitorsService) {}

  @Get(':projectId')
  async getCompetitors(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @CustomRequest(UserPipe) user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const competitors = await this.competitorsService.getAll(project.id);
    if (competitors.length === 0) {
      return null;
    }

    if (user.subscription === 'basic') {
      return competitors.slice(0, 1).map(mapCompetitorToEntity);
    }

    return competitors.map(mapCompetitorToEntity);

    // const createdCompetitors =
    //   await this.competitorsService.generateForProject(project);
    //
    // return createdCompetitors.map(mapCompetitorToEntity);
  }
}
