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
import { SupabaseStorageService } from '../../../supabase/supabase-storage.service';
import { PhasesService } from '../../phases/services/phases.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  readonly logoPath: string;

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly phasesService: PhasesService,
    // private readonly milestonesService: MilestonesService,
    // private readonly projectsAiService: ProjectsAiService,
    // private readonly tasksService: TasksService,
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
      await this.phasesService.startPhase(firstPhase);
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
