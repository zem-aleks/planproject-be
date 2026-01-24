import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from '../services/projects.service';
import { ZodValidationPipe } from '../../../../shared/pipes/zod-validation.pipe';
import { CREATE_PROJECT_SCHEMA, ProjectCreateData } from '../types/entity';
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

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  readonly logoPath: string;

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly plansService: PlansService,
    private readonly storageService: SupabaseStorageService,
    private readonly membershipService: MembershipService,
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
