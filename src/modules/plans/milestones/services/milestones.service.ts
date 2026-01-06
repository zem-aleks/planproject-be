import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

  async update(data: Omit<Milestone, 'tasks' | 'phase'>): Promise<Milestone> {
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

  async getByIds(milestoneIds: string[]) {
    return this.repository.find({
      where: { id: In(milestoneIds) },
      order: { orderIndex: 'ASC' },
      relations: ['phase'],
    });
  }

  async getActiveMilestones(projectId: string) {
    return this.repository.find({
      where: { projectId, status: 'inProgress' },
      order: { orderIndex: 'ASC' },
      relations: ['phase'],
    });
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

  async completeMilestone({
    milestone,
    message,
  }: {
    milestone: Milestone;
    message: string;
  }) {
    milestone.status = 'completed';
    milestone.completeMessage = message;
    milestone.completedAt = new Date();
    return this.update(milestone);
  }

  async activate(milestone: Milestone) {
    milestone.status = 'inProgress';
    milestone.startedAt = new Date();
    return this.update(milestone);
  }

  async getPhaseMilestones(phaseId: string, withTasks?: boolean) {
    return this.repository.find({
      where: { phaseId },
      order: { orderIndex: 'ASC' },
      relations: withTasks ? ['tasks'] : [],
    });
  }
}
