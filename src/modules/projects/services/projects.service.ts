import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly repository: Repository<Project>,
  ) {}

  async create(
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'startedAt'>,
  ): Promise<Project> {
    return this.repository.save(data);
  }

  async update(data: Project): Promise<Project> {
    return this.repository.save(data);
  }

  async getAll(userId: string) {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getOneById(projectId: string) {
    return this.repository.findOne({ where: { id: projectId } });
  }

  async getOneByIdOrThrow(projectId: string) {
    const project = await this.getOneById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async getOneByShapingId(shapingId: string) {
    return this.repository.findOne({ where: { shapingId } });
  }

  async softDelete(projectId: string) {
    return this.repository.softDelete(projectId);
  }
}
