import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TimelinePoint } from '../entities/timeline-point.entity';
import { Project } from '../../plans/projects/entities/project.entity';
import { TimelineAiService } from './timeline-ai.service';
import { Milestone } from '../../plans/milestones/entities/milestone.entity';

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

    // const startedTasks = activeTasks.filter((t) => t.status === 'inProgress');
    // if (startedTasks.length > 0) {
    //   return this.create({
    //     projectId: project.id,
    //     projectDay,
    //     comment: `You have ${startedTasks.length} tasks in progress. Focus on completing them before starting new ones.`,
    //     taskIds: startedTasks.map((task) => task.id),
    //     completed: false,
    //   });
    // }
    //
    // const nextTask = activeTasks[0];
    // const sameMilestoneAndDayTasks = activeTasks.filter(
    //   (t) => t.milestone.id === nextTask.milestone.id && t.day === nextTask.day,
    // );
    //
    // if (sameMilestoneAndDayTasks.length > 0) {
    //   const comment = await this.timelineAiService.generateTimelinePointContent(
    //     {
    //       previousTimelinePoint,
    //       project,
    //       activeTasks: sameMilestoneAndDayTasks,
    //       projectDay,
    //     },
    //   );
    //
    //   return this.create({
    //     projectId: project.id,
    //     projectDay,
    //     comment,
    //     taskIds: sameMilestoneAndDayTasks.map((task) => task.id),
    //     completed: false,
    //   });
    // }
    //
    // return null;
  }
}
