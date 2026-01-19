import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TimelinePoint } from '../entities/timeline-point.entity';
import { TimelineEvent } from '../types/entity';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(TimelinePoint)
    private readonly repository: Repository<TimelinePoint>,
  ) {}

  async create(
    data: Omit<TimelinePoint, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<TimelinePoint> {
    return this.repository.save(data);
  }

  async update(data: TimelinePoint): Promise<TimelinePoint> {
    return this.repository.save(data);
  }

  async updatePartial(id: string, data: Partial<TimelinePoint>) {
    return this.repository.update(id, data);
  }

  async getProjectHistory(projectId: string) {
    return this.repository.find({
      where: { projectId },
      order: { projectDay: 'ASC' },
    });
  }

  async getTimelinePoint({
    projectId,
    projectDay,
  }: {
    projectId: string;
    projectDay: number;
  }) {
    return this.repository.findOne({ where: { projectId, projectDay } });
  }

  async getPreviousTimelinePoint({
    projectId,
    projectDay,
  }: {
    projectId: string;
    projectDay: number;
  }) {
    // TODO: Possible bug, check the order!!!!!
    return this.repository.findOne({
      where: { projectId, projectDay: LessThan(projectDay) },
    });
  }

  // async updateTimelinePoint({
  //   project,
  //   timelinePoint,
  //   newMilestone,
  //   finishedMilestones,
  // }: {
  //   project: Project;
  //   timelinePoint: TimelinePoint;
  //   newMilestone: Milestone;
  //   finishedMilestones: Milestone[];
  // }) {
  //   const projectDay = getProjectDay(project);
  //   const comment =
  //     await this.timelineAiService.generateUpdatedTimelinePointContent({
  //       project,
  //       newMilestone,
  //       finishedMilestones,
  //       projectDay,
  //     });
  //
  //   return this.repository.save({
  //     ...timelinePoint,
  //     comment,
  //     milestoneIds: [...timelinePoint.milestoneIds, newMilestone.id],
  //     completed: false,
  //   });
  // }

  async createTimelinePoint({
    projectId,
    projectDay,
    events,
  }: {
    projectId: string;
    projectDay: number;
    events: TimelineEvent[];
  }) {
    return this.create({
      projectId,
      projectDay,
      events,
    });
  }

  async getTimelinePointOrCreate(data: {
    projectId: string;
    projectDay: number;
  }) {
    const existingPoint = await this.getTimelinePoint(data);
    if (existingPoint) {
      return existingPoint;
    }

    return this.createTimelinePoint({ ...data, events: [] });
  }
}
