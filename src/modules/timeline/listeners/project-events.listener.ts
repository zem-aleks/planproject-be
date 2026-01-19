import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TimelineEventsService } from '../services/timeline-events.service';

@Injectable()
export class ProjectEventsListener {
  constructor(private readonly timelineEventsService: TimelineEventsService) {}

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
}
