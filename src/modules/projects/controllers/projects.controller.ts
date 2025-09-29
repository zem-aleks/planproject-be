import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from '../services/projects.service';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation.pipe';
import { CREATE_PROJECT_SCHEMA, ProjectCreateData } from '../types/entity';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';
import { mapProjectToEntity } from '../mappers/mapProjectToEntity';
import { ProjectByIdPipe } from '../pipes/project-by-id.pipe';
import { Project } from '../entities/project.entity';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async createProject(
    @Body(new ZodValidationPipe(CREATE_PROJECT_SCHEMA))
    data: ProjectCreateData,
    @AuthUser()
    user: User,
  ) {
    const project = await this.projectsService.create({
      ...data,
      summary: null,
      userId: user.id,
      status: 'shaping',
    });
    return mapProjectToEntity(project);
  }

  @Get()
  async getProjects() {
    // TODO: projects of a user only
    const projects = await this.projectsService.getAll();
    return projects.map(mapProjectToEntity);
  }

  @Get(':projectId')
  async getProject(@Param('projectId', ProjectByIdPipe) project: Project) {
    // TODO: projects of a user only
    return mapProjectToEntity(project);
  }

  @Patch(':projectId')
  async updateProject(
    @Body(new ZodValidationPipe(CREATE_PROJECT_SCHEMA))
    data: ProjectCreateData,
    @Param('projectId', ProjectByIdPipe) project: Project,
  ) {
    const updatedProject = await this.projectsService.update({
      ...project,
      ...data,
    });
    return mapProjectToEntity(updatedProject);
  }

  @Delete(':projectId')
  async deleteProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectsService.softDelete(projectId);
  }
}
