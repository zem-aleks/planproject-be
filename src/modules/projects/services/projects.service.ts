import { Injectable } from '@nestjs/common';
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

  async getAll() {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async getOneById(projectId: string) {
    return this.repository.findOne({ where: { id: projectId } });
  }

  async softDelete(projectId: string) {
    return this.repository.softDelete(projectId);
  }
}
