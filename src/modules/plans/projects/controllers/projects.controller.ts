import {
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
import { User } from '@supabase/supabase-js';
import { mapProjectToEntity } from '../mappers/mapProjectToEntity';
import { ProjectByIdPipe } from '../pipes/project-by-id.pipe';
import { Project } from '../entities/project.entity';
import { ProjectsAiService } from '../services/projects-ai.service';
import { SupabaseStorageService } from '../../../supabase/supabase-storage.service';
import { notReachable } from '../../../../shared/utils/notReachable';
import { PhasesService } from '../../phases/services/phases.service';
import { MilestonesService } from '../../milestones/services/milestones.service';
import { TasksService } from '../../tasks/services/tasks.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  readonly logoPath: string;

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly phasesService: PhasesService,
    private readonly milestonesService: MilestonesService,
    private readonly projectsAiService: ProjectsAiService,
    private readonly tasksService: TasksService,
    private readonly storageService: SupabaseStorageService,
    // private readonly tasksAiService: TasksAiService,
  ) {
    this.logoPath = this.storageService.getBucketUrl('logo') + '/';
  }

  // @Post()
  // async createProject(
  //   @Body(new ZodValidationPipe(CREATE_PROJECT_SCHEMA))
  //   data: ProjectCreateData,
  //   @AuthUser() user: User,
  // ) {
  //   const project = await this.projectsService.create({
  //     ...data,
  //     summary: null,
  //     userId: user.id,
  //     status: 'shaping',
  //     daysNeeded: null,
  //     clientId: null,
  //   });
  //   return mapProjectToEntity(project, this.logoPath);
  // }

  @Patch(':projectId/start')
  async startProject(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const updatedProject = await this.projectsService.update({
      ...project,
      status: 'active',
      startedAt: new Date(),
    });

    const firstPhase = await this.phasesService.getFirstNotStarted(project.id);
    if (firstPhase) {
      await this.phasesService.startPhase(firstPhase, project);
    }

    return mapProjectToEntity(updatedProject, this.logoPath);
  }

  @Get()
  async getProjects(@AuthUser() user: User) {
    const projects = await this.projectsService.getAll(user.id);
    return projects.map((project) =>
      mapProjectToEntity(project, this.logoPath),
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

  @Patch(':projectId/logo')
  async generateProjectLogo(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    await this.projectsService.update({
      ...project,
      logoUrl: 'loading',
    });

    const base64 = await this.projectsAiService.generateLogo(project);
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
        const updatedProject = await this.projectsService.update({
          ...project,
          logoUrl: null,
        });
        return mapProjectToEntity(updatedProject, this.logoPath);
      }

      case 'success': {
        const updatedProject = await this.projectsService.update({
          ...project,
          logoUrl: uploadState.url,
        });
        return mapProjectToEntity(updatedProject, this.logoPath);
      }

      default:
        return notReachable(uploadState);
    }
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
