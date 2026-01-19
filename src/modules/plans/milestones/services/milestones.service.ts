import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Milestone } from '../entities/milestone.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MilestonesService {
  constructor(
    @InjectRepository(Milestone)
    private readonly repository: Repository<Milestone>,
    private eventEmitter: EventEmitter2,
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

  async getAllByProject(projectId: string) {
    return this.repository.find({
      where: { projectId },
      order: { orderIndex: 'ASC' },
    });
  }

  async getOneById(milestoneId: string) {
    return this.repository.findOne({ where: { id: milestoneId } });
  }

  async getOneByIdWithPhase(milestoneId: string) {
    return this.repository.findOne({
      where: { id: milestoneId },
      relations: ['phase'],
    });
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

  async getActiveMilestone(projectId: string) {
    return this.repository.findOne({
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
    projectDay,
  }: {
    milestone: Milestone;
    message: string;
    projectDay: number;
  }) {
    milestone.status = 'completed';
    milestone.completeMessage = message;
    milestone.completedAt = new Date();

    this.eventEmitter.emit('milestone.completed', {
      milestoneIds: [milestone.id],
      projectId: milestone.projectId,
      projectDay,
    });

    return this.update(milestone);
  }

  async completeMilestones({
    milestoneIds,
    projectDay,
    projectId,
  }: {
    milestoneIds: string[];
    projectDay: number;
    projectId: string;
  }) {
    const result = await this.repository.update(milestoneIds, {
      status: 'completed',
      completedAt: new Date(),
    });

    this.eventEmitter.emit('milestone.completed', {
      milestoneIds,
      projectDay,
      projectId,
    });

    return result;
  }

  async activate(milestone: Milestone, projectDay: number) {
    milestone.status = 'inProgress';
    milestone.startedAt = new Date();
    const result = await this.update(milestone);
    this.eventEmitter.emit('milestone.started', {
      milestoneId: milestone.id,
      projectId: milestone.projectId,
      projectDay,
    });

    return result;
  }

  async areAllMilestonesCompleted(phaseId: string) {
    const notCompletedCount = await this.repository.count({
      where: { phaseId, status: Not('completed') },
    });

    return notCompletedCount === 0;
  }

  async getPhaseMilestones(phaseId: string) {
    return this.repository.find({
      where: { phaseId },
      order: { orderIndex: 'ASC' },
    });
  }
}
