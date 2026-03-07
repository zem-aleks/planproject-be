import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TimelinePoint } from '../entities/timeline-point.entity';
import { TimelineEvent } from '../types/entity';
import * as dayjs from 'dayjs';

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
      order: { date: 'ASC' },
    });
  }

  async getTimelinePoint({
    projectId,
    date,
  }: {
    projectId: string;
    date: string;
  }) {
    return this.repository.findOne({ where: { projectId, date } });
  }

  async getPreviousTimelinePoint({
    projectId,
    date,
  }: {
    projectId: string;
    date: string;
  }) {
    return this.repository.findOne({
      where: { projectId, date: LessThan(date) },
      order: { date: 'DESC' },
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
    date,
    events,
  }: {
    projectId: string;
    projectDay: number;
    date: string;
    events: TimelineEvent[];
  }) {
    return this.create({
      projectId,
      projectDay,
      date,
      events,
    });
  }

  async getTimelinePointOrCreate(data: {
    projectId: string;
    projectDay: number;
  }) {
    const date = dayjs().format('YYYY-MM-DD');
    const existingPoint = await this.getTimelinePoint({
      projectId: data.projectId,
      date,
    });
    if (existingPoint) {
      return existingPoint;
    }

    return this.createTimelinePoint({
      ...data,
      date,
      events: [],
    });
  }
}
