import {
  Controller,
  Get,
  Param,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { Project } from '../../plans/projects/entities/project.entity';
import { AuditoryService } from '../services/auditory.service';
import { ActiveProjectByIdPipe } from '../../plans/projects/pipes/active-project-by-id.pipe';
import { CustomRequest } from '../../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../../users/pipes/user.pipe';
import { User } from '../../users/entities/user.entity';
import {
  mapAuditoryBasicData,
  mapAuditoryBusinessData,
  mapAuditoryProData,
} from '../mappers/mapAuditoryToEntity';
import { AuditoryData } from '../types/entity';

@Controller('auditory')
@UseGuards(JwtAuthGuard)
export class AuditoryController {
  constructor(private readonly auditoryService: AuditoryService) {}

  @Get(':projectId')
  async getAuditory(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @CustomRequest(UserPipe) user: User,
  ): Promise<AuditoryData | null> {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const auditory = await this.auditoryService.find(project.id);
    if (!auditory) {
      return null;
    }

    return {
      basic: mapAuditoryBasicData(auditory),
      pro:
        user.subscription === 'pro' || user.subscription === 'business'
          ? mapAuditoryProData(auditory)
          : null,
      business:
        user.subscription === 'business'
          ? mapAuditoryBusinessData(auditory)
          : null,
    };
  }

  // @Patch(':projectId')
  // async createAuditoryInfo(
  //   @Param('projectId', ActiveProjectByIdPipe) project: Project,
  //   @AuthUser() user: User,
  // ) {
  //   if (project.userId !== user.id) {
  //     throw new UnauthorizedException('Permissions denied');
  //   }
  //
  //   const auditory = await this.auditoryService.find(project.id);
  //   if (!auditory) {
  //     throw new BadRequestException({
  //       message: 'Auditory does not exist.',
  //       code: 'AUDITORY_NOT_FOUND',
  //     });
  //   }
  //
  //   const auditoryInfo = await this.auditoryAiService.generateAuditoryInfo({
  //     project,
  //   });
  //
  //   await this.auditoryService.update(auditory.id, auditoryInfo);
  //
  //   return mapAuditoryToEntity({
  //     ...auditory,
  //     ...auditoryInfo,
  //   });
  // }
  //
  // @Patch(':projectId/details')
  // async createAuditoryDetails(
  //   @Param('projectId', ActiveProjectByIdPipe) project: Project,
  //   @AuthUser() user: User,
  // ) {
  //   if (project.userId !== user.id) {
  //     throw new UnauthorizedException('Permissions denied');
  //   }
  //
  //   const auditory = await this.auditoryService.find(project.id);
  //   if (!auditory) {
  //     throw new BadRequestException({
  //       message: 'Auditory does not exist.',
  //       code: 'AUDITORY_NOT_FOUND',
  //     });
  //   }
  //
  //   const auditoryDetails =
  //     await this.auditoryAiService.generateAuditoryDetails({
  //       project,
  //     });
  //
  //   await this.auditoryService.update(auditory.id, auditoryDetails);
  //
  //   return mapAuditoryToEntity({
  //     ...auditory,
  //     ...auditoryDetails,
  //   });
  // }
}
