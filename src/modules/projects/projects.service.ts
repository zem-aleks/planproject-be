import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly repository: Repository<Project>,
  ) {}

  async create(
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Project> {
    return this.repository.save(data);
  }

  async update(data: Project): Promise<Project> {
    return this.repository.save(data);
  }

  async getAll() {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async getOneById(assistantId: string) {
    return this.repository.findOne({ where: { id: assistantId } });
  }

  async softDelete(assistantId: string) {
    return this.repository.softDelete(assistantId);
  }
}
