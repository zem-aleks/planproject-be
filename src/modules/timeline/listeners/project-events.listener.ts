import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TimelineEventsService } from '../services/timeline-events.service';
import { ProjectsService } from '../../plans/projects/services/projects.service';
import { getProjectDay } from '../../plans/projects/helpers/getProjectDay';

@Injectable()
export class ProjectEventsListener {
  constructor(
    private readonly timelineEventsService: TimelineEventsService,
    private readonly projectsService: ProjectsService,
  ) {}

  @OnEvent('milestone.completed')
  async handleCompletedMilestones({
    milestoneIds,
    projectId,
    projectDay,
  }: {
    milestoneIds: string[];
    projectId: string;
    projectDay: number;
  }) {
    const today = new Date();
    await this.timelineEventsService.registerEvents({
      projectId,
      projectDay,
      events: milestoneIds.map((milestoneId) => ({
        type: 'milestone.completed',
        completedAt: today,
        milestoneId,
      })),
    });
  }

  @OnEvent('milestone.started')
  async handleStartedMilestone({
    milestoneId,
    projectId,
    projectDay,
  }: {
    milestoneId: string;
    projectId: string;
    projectDay: number;
  }) {
    await this.timelineEventsService.registerEvents({
      projectId,
      projectDay,
      events: [
        {
          type: 'milestone.started',
          milestoneId,
          startedAt: new Date(),
          comment: '',
        },
      ],
    });
  }

  @OnEvent('phase.started')
  async handleStartedPhase({
    phaseId,
    projectId,
    projectDay,
  }: {
    phaseId: string;
    projectId: string;
    projectDay: number;
  }) {
    await this.timelineEventsService.registerEvents({
      projectId,
      projectDay,
      events: [{ type: 'phase.started', phaseId }],
    });
  }

  @OnEvent('phase.completed')
  async handleCompletedPhase({
    phaseId,
    projectId,
    projectDay,
  }: {
    phaseId: string;
    projectId: string;
    projectDay: number;
  }) {
    await this.timelineEventsService.registerEvents({
      projectId,
      projectDay,
      events: [{ type: 'phase.completed', phaseId }],
    });
  }

  @OnEvent('project.started')
  async handleStartedProject({
    projectId,
    projectDay,
  }: {
    projectId: string;
    projectDay: number;
  }) {
    await this.timelineEventsService.registerEvents({
      projectId,
      projectDay,
      events: [{ type: 'project.started', projectId }],
    });
  }

  @OnEvent('project.completed')
  async handleCompletedProject({
    projectId,
    projectDay,
  }: {
    projectId: string;
    projectDay: number;
  }) {
    await this.timelineEventsService.registerEvents({
      projectId,
      projectDay,
      events: [{ type: 'project.completed', projectId }],
    });
  }

  private async resolveProjectDay(projectId: string): Promise<number> {
    const project = await this.projectsService.getOneById(projectId);
    return project ? getProjectDay(project) : 1;
  }

  @OnEvent('focus.changed')
  async handleFocusChanged({
    projectId,
    milestoneIds,
    milestoneTitles,
  }: {
    projectId: string;
    milestoneIds: string[];
    milestoneTitles: string[];
  }) {
    const projectDay = await this.resolveProjectDay(projectId);
    await this.timelineEventsService.registerEvents({
      projectId,
      projectDay,
      events: [
        {
          type: 'focus.changed',
          milestoneIds,
          milestoneTitles,
          createdAt: new Date(),
        },
      ],
    });
  }

  @OnEvent('soul.updated')
  async handleSoulUpdated({
    projectId,
    description,
  }: {
    projectId: string;
    description: string;
  }) {
    const projectDay = await this.resolveProjectDay(projectId);
    await this.timelineEventsService.registerEvents({
      projectId,
      projectDay,
      events: [
        {
          type: 'soul.updated',
          description,
          createdAt: new Date(),
        },
      ],
    });
  }

  @OnEvent('chat.created')
  async handleChatCreated({
    projectId,
    chatId,
    chatName,
    contextType,
    contextLabel,
  }: {
    projectId: string;
    chatId: string;
    chatName: string | null;
    contextType: string | null;
    contextLabel: string | null;
  }) {
    const projectDay = await this.resolveProjectDay(projectId);
    await this.timelineEventsService.registerEvents({
      projectId,
      projectDay,
      events: [
        {
          type: 'chat.created',
          chatId,
          chatName,
          contextType,
          contextLabel,
          createdAt: new Date(),
        },
      ],
    });
  }

  @OnEvent('task.completed')
  async handleTaskCompleted({
    taskId,
    taskTitle,
    milestoneId,
    projectId,
    message,
  }: {
    taskId: string;
    taskTitle: string;
    milestoneId: string;
    projectId: string;
    message: string;
  }) {
    const projectDay = await this.resolveProjectDay(projectId);
    await this.timelineEventsService.registerEvents({
      projectId,
      projectDay,
      events: [
        {
          type: 'task.completed',
          taskId,
          taskTitle,
          milestoneId,
          message,
          completedAt: new Date(),
        },
      ],
    });
  }
}
