import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from '../projects.service';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation.pipe';
import { CREATE_PROJECT_SCHEMA, ProjectCreateData } from '../types/entity';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';
import { mapProjectToEntity } from '../mappers/mapProjectToEntity';

@Controller('admin/projects')
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
      userId: user.id,
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
  async getProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    // TODO: projects of a user only
    const project = await this.projectsService.getOneById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return mapProjectToEntity(project);
  }

  @Patch(':projectId')
  async updateProject(
    @Body(new ZodValidationPipe(CREATE_PROJECT_SCHEMA))
    data: ProjectCreateData,
    @Param('projectId', ParseUUIDPipe) id: string,
  ) {
    const project = await this.projectsService.getOneById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

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
