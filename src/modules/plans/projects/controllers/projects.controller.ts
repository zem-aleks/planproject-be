import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from '../services/projects.service';
import { ZodValidationPipe } from '../../../../shared/pipes/zod-validation.pipe';
import {
  ADD_SOUL_OPERATION_SCHEMA,
  AddSoulOperationData,
  CREATE_PROJECT_SCHEMA,
  ProjectCreateData,
  REMOVE_SOUL_OPERATION_SCHEMA,
  RemoveSoulOperationData,
} from '../types/entity';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { AuthUser } from '../../../../shared/decorators/auth.decorator';
import {
  mapProjectToEntity,
  mapProjectToPreviewEntity,
} from '../mappers/mapProjectToEntity';
import { ProjectByIdPipe } from '../pipes/project-by-id.pipe';
import { Project } from '../entities/project.entity';
import { SupabaseStorageService } from '../../../supabase/supabase-storage.service';
import { PlansService } from '../../services/plans.service';
import { getProjectDay } from '../helpers/getProjectDay';
import { CustomRequest } from '../../../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../../../users/pipes/user.pipe';
import { MembershipService } from '../../../subscriptions/services/membership.service';
import { User } from 'src/modules/users/entities/user.entity';
import { ActiveProjectByIdPipe } from '../pipes/active-project-by-id.pipe';
import { SoulAiService } from '../services/soul-ai.service';
import { SoulQueueService } from '../services/soul-queue.service';
import { ShapingService } from '../../../shaping/services/shaping.service';
import { notReachable } from '../../../../shared/utils/notReachable';
import { PhasesService } from '../../phases/services/phases.service';
import { ProjectsAiService } from '../services/projects-ai.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  readonly logoPath: string;

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly soulAiService: SoulAiService,
    private readonly soulQueueService: SoulQueueService,
    private readonly shapingService: ShapingService,
    private readonly plansService: PlansService,
    private readonly storageService: SupabaseStorageService,
    private readonly membershipService: MembershipService,
    private readonly phasesService: PhasesService,
    private readonly projectsAiService: ProjectsAiService,
  ) {
    this.logoPath = this.storageService.getBucketUrl('logo') + '/';
  }

  @Patch(':projectId/start')
  async startProject(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    await this.projectsService.activate(project.id, getProjectDay(project));
    const updatedProject = await this.projectsService.getOneByIdOrThrow(
      project.id,
    );

    await this.plansService.activateNextMilestone(updatedProject);
    return mapProjectToEntity(updatedProject, this.logoPath);
  }

  @Patch(':projectId/init-soul')
  async initSoul(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const shaping = await this.shapingService.getOneByProjectId({
      projectId: project.id,
      userId: project.userId,
    });

    if (!shaping) {
      throw new BadRequestException('No shaping data');
    }

    switch (project.status) {
      case 'soulBuilding':
        throw new BadRequestException('Soul creation in progress...');

      case 'shaping':
      case 'soulError':
        const projectWithSoul = await this.projectsService.generateSoul(
          project,
          shaping,
        );
        return mapProjectToEntity(projectWithSoul, this.logoPath);

      case 'draft':
      case 'soulDone':
      case 'planning':
      case 'planningError':
      case 'analyzing':
      case 'active':
      case 'completed':
      case 'onHold':
      case 'cancelled':
        if (!project.soul) {
          const projectWithSoul = await this.projectsService.generateSoul(
            project,
            shaping,
          );
          return mapProjectToEntity(projectWithSoul, this.logoPath);
        }
        throw new BadRequestException('Soul already exists!');

      default:
        return notReachable(project.status);
    }
  }

  @Post(':projectId/build-plan')
  async buildPlan(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    if (!project.soul) {
      throw new BadRequestException('Project has no soul');
    }

    project.status = 'planning';
    await this.projectsService.updatePartial(project.id, {
      status: 'planning',
    });

    try {
      await this.phasesService.deleteForProject(project.id);

      const phases = await this.phasesService.generateForProject(project);

      const daysNeeded = Math.max(...phases.map((p) => p.timelineEndDay));

      const updatedProject = await this.projectsService.update({
        ...project,
        status: 'planning',
        daysNeeded,
      });

      return mapProjectToEntity(updatedProject, this.logoPath);
    } catch (error) {
      await this.projectsService.updatePartial(project.id, {
        status: 'planningError',
      });
      throw error;
    }
  }

  @Patch(':projectId/logo')
  async regenerateLogo(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    if (!project.soul) {
      throw new BadRequestException('Project has no soul');
    }

    if (project.logoUrl === 'loading') {
      throw new BadRequestException('Logo generation is already in progress');
    }

    await this.projectsService.updatePartial(project.id, {
      logoUrl: 'loading',
    });

    const base64 = await this.projectsAiService.regenerateLogo(project);
    if (!base64) {
      await this.projectsService.updatePartial(project.id, { logoUrl: null });
      return mapProjectToEntity({ ...project, logoUrl: null }, this.logoPath);
    }

    const buffer = Buffer.from(base64, 'base64');
    const imageName = `${project.id}-${Math.floor(Math.random() * 10000)}.png`;
    const uploadState = await this.storageService.upload({
      bucketId: 'logo',
      contentType: 'image/png',
      name: imageName,
      fileBody: buffer,
    });

    switch (uploadState.type) {
      case 'error': {
        await this.projectsService.updatePartial(project.id, {
          logoUrl: null,
        });
        return mapProjectToEntity({ ...project, logoUrl: null }, this.logoPath);
      }

      case 'success': {
        await this.projectsService.updatePartial(project.id, {
          logoUrl: uploadState.url,
        });
        return mapProjectToEntity(
          { ...project, logoUrl: uploadState.url },
          this.logoPath,
        );
      }

      default:
        return notReachable(uploadState);
    }
  }

  @Get()
  async getProjects(@AuthUser() user: User) {
    const projects = await this.projectsService.getAll(user.id);
    return projects.map((project) =>
      mapProjectToPreviewEntity(project, this.logoPath),
    );
  }

  @Get(':projectId')
  async getProject(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }
    return mapProjectToEntity(project, this.logoPath);
  }

  @Get(':projectId/progress')
  async getProjectProgress(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    return this.plansService.getProgress(project);
  }

  @Patch(':projectId')
  async updateProject(
    @Body(new ZodValidationPipe(CREATE_PROJECT_SCHEMA))
    data: ProjectCreateData,
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const updatedProject = await this.projectsService.update({
      ...project,
      ...data,
    });
    return mapProjectToEntity(updatedProject, this.logoPath);
  }

  @Patch(':projectId/unlock')
  async unlockProject(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @CustomRequest(UserPipe) user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    if (project.activated) {
      throw new BadRequestException('Project is already activated');
    }

    const canActivate =
      await this.membershipService.canActivateNewProject(user);

    if (!canActivate) {
      throw new BadRequestException('Subscription quota exceeded');
    }

    await this.projectsService.updatePartial(project.id, { activated: true });
    return mapProjectToEntity({ ...project, activated: true }, this.logoPath);
  }

  @Post(':projectId/soul/queue')
  async addToSoulQueue(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @Body(new ZodValidationPipe(ADD_SOUL_OPERATION_SCHEMA))
    data: AddSoulOperationData,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }
    const updated = await this.soulQueueService.addOperation(project, data);
    return mapProjectToEntity(updated, this.logoPath);
  }

  @Delete(':projectId/soul/queue')
  async removeFromSoulQueue(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @Body(new ZodValidationPipe(REMOVE_SOUL_OPERATION_SCHEMA))
    data: RemoveSoulOperationData,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }
    const updated = await this.soulQueueService.removeOperation(
      project,
      data.operationId,
    );
    return mapProjectToEntity(updated, this.logoPath);
  }

  @Post(':projectId/soul/queue/apply')
  async applySoulQueue(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }
    const updated = await this.soulQueueService.applyQueue(project);
    return mapProjectToEntity(updated, this.logoPath);
  }

  @Post(':projectId/soul/queue/cancel')
  async cancelSoulQueue(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }
    const updated = await this.soulQueueService.cancelQueue(project);
    return mapProjectToEntity(updated, this.logoPath);
  }

  @Delete(':projectId')
  async deleteProject(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    return this.projectsService.softDelete(project.id);
  }
}
