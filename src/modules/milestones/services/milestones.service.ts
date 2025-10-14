import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Milestone } from '../entities/milestone.entity';

@Injectable()
export class MilestonesService {
  constructor(
    @InjectRepository(Milestone)
    private readonly repository: Repository<Milestone>,
  ) {}

  async create(
    data: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Milestone> {
    return this.repository.save(data);
  }

  async createMany(
    data: Array<
      Omit<Milestone, 'id' | 'createdAt' | 'updatedAt' | 'phase' | 'tasks'>
    >,
  ): Promise<Milestone[]> {
    return this.repository.save(data);
  }

  async update(data: Milestone): Promise<Milestone> {
    return this.repository.save(data);
  }

  async getAll(phaseId: string) {
    return this.repository.find({
      where: { phaseId },
      order: { orderIndex: 'ASC' },
    });
  }

  async getOneById(milestoneId: string) {
    return this.repository.findOne({ where: { id: milestoneId } });
  }

  async getOneByIdOtThrow(milestoneId: string) {
    const milestone = await this.getOneById(milestoneId);
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    return milestone;
  }

  async softDelete(milestoneId: string) {
    return this.repository.softDelete(milestoneId);
  }

  // async getActiveByProjectId(projectId: string) {
  //   return this.repository.find({
  //     where: { projectId, status: 'inProgress' },
  //     order: { orderIndex: 'ASC' },
  //   });
  // }
}
