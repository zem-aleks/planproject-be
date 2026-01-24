import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';
import { Project } from '../../plans/projects/entities/project.entity';
import { AuditoryService } from '../services/auditory.service';
import { AuditoryAiService } from '../services/auditory-ai.service';
import { mapAuditoryToEntity } from '../mappers/mapAuditoryToEntity';
import { ActiveProjectByIdPipe } from '../../plans/projects/pipes/active-project-by-id.pipe';

@Controller('auditory')
@UseGuards(JwtAuthGuard)
export class AuditoryController {
  constructor(
    private readonly auditoryService: AuditoryService,
    private readonly auditoryAiService: AuditoryAiService,
  ) {}

  @Get(':projectId')
  async getAuditory(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    return this.auditoryService.getOrCreate(project.id);
  }

  @Patch(':projectId')
  async createAuditoryInfo(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const auditory = await this.auditoryService.find(project.id);
    if (!auditory) {
      throw new BadRequestException({
        message: 'Auditory does not exist.',
        code: 'AUDITORY_NOT_FOUND',
      });
    }

    const auditoryInfo = await this.auditoryAiService.generateAuditoryInfo({
      project,
    });

    await this.auditoryService.update(auditory.id, auditoryInfo);

    return mapAuditoryToEntity({
      ...auditory,
      ...auditoryInfo,
    });
  }

  @Patch(':projectId/details')
  async createAuditoryDetails(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const auditory = await this.auditoryService.find(project.id);
    if (!auditory) {
      throw new BadRequestException({
        message: 'Auditory does not exist.',
        code: 'AUDITORY_NOT_FOUND',
      });
    }

    const auditoryDetails =
      await this.auditoryAiService.generateAuditoryDetails({
        project,
      });

    await this.auditoryService.update(auditory.id, auditoryDetails);

    return mapAuditoryToEntity({
      ...auditory,
      ...auditoryDetails,
    });
  }
}
