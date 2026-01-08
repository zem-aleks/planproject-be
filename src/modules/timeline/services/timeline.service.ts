import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TimelinePoint } from '../entities/timeline-point.entity';
import { Project } from '../../plans/projects/entities/project.entity';
import { TimelineAiService } from './timeline-ai.service';
import { Milestone } from '../../plans/milestones/entities/milestone.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(TimelinePoint)
    private readonly repository: Repository<TimelinePoint>,
    private readonly timelineAiService: TimelineAiService,
  ) {}

  async create(
    data: Omit<TimelinePoint, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<TimelinePoint> {
    return this.repository.save(data);
  }

  async update(data: TimelinePoint): Promise<TimelinePoint> {
    return this.repository.save(data);
  }

  async getProjectHistory(projectId: string) {
    return this.repository.find({
      where: { projectId },
      order: { projectDay: 'DESC' },
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

  async updateTimelinePoint({
    project,
    timelinePoint,
    newMilestone,
    finishedMilestones,
  }: {
    project: Project;
    timelinePoint: TimelinePoint;
    newMilestone: Milestone;
    finishedMilestones: Milestone[];
  }) {
    const projectDay = dayjs().diff(project.startedAt, 'days') + 1;
    const comment =
      await this.timelineAiService.generateUpdatedTimelinePointContent({
        project,
        newMilestone,
        finishedMilestones,
        projectDay,
      });

    return this.repository.save({
      ...timelinePoint,
      comment,
      milestoneIds: [...timelinePoint.milestoneIds, newMilestone.id],
      completed: false,
    });
  }

  async generateTimelinePoint({
    project,
    projectDay,
    activeMilestones,
  }: {
    project: Project;
    projectDay: number;
    activeMilestones: Milestone[];
  }) {
    const previousTimelinePoint = await this.getPreviousTimelinePoint({
      projectId: project.id,
      projectDay,
    });
    const comment = await this.timelineAiService.generateTimelinePointContent({
      previousTimelinePoint,
      project,
      activeMilestones,
      projectDay,
    });

    return this.create({
      projectId: project.id,
      projectDay,
      comment,
      milestoneIds: activeMilestones.map((m) => m.id),
      completed: false,
    });
  }
}
