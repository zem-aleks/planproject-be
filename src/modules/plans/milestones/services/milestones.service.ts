import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Milestone } from '../entities/milestone.entity';
import { TimelineService } from '../../../timeline/services/timeline.service';
import { getProjectDay } from '../../projects/helpers/getProjectDay';
import { Project } from '../../projects/entities/project.entity';

@Injectable()
export class MilestonesService {
  constructor(
    @InjectRepository(Milestone)
    private readonly repository: Repository<Milestone>,
    private timelineService: TimelineService,
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
    projectDay,
  }: {
    milestone: Milestone;
    message: string;
    projectDay: number;
  }) {
    milestone.status = 'completed';
    milestone.completeMessage = message;
    milestone.completedAt = new Date();

    await this.timelineService.registerMilestonesCompletion({
      milestoneIds: [milestone.id],
      projectId: milestone.id,
      projectDay,
    });

    return this.update(milestone);
  }

  async completeMilestones(milestoneIds: string[], project: Project) {
    const result = await this.repository.update(milestoneIds, {
      status: 'completed',
      completedAt: new Date(),
    });

    await this.timelineService.registerMilestonesCompletion({
      milestoneIds,
      projectId: project.id,
      projectDay: getProjectDay(project),
    });

    return result;
  }

  async activate(milestone: Milestone) {
    milestone.status = 'inProgress';
    milestone.startedAt = new Date();
    return this.update(milestone);
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
