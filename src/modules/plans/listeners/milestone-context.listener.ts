import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MilestonesService } from '../milestones/services/milestones.service';
import { TasksService } from '../tasks/services/tasks.service';

@Injectable()
export class MilestoneContextListener {
  private readonly logger = new Logger(MilestoneContextListener.name);

  constructor(
    private readonly milestonesService: MilestonesService,
    private readonly tasksService: TasksService,
  ) {}

  @OnEvent('task.completed')
  async onTaskCompleted(payload: {
    taskId: string;
    milestoneId: string;
    projectId: string;
    message: string;
  }) {
    try {
      const milestone = await this.milestonesService.getOneById(
        payload.milestoneId,
      );
      if (!milestone) return;

      // Only set context if there's none yet — give user a starting point.
      // Don't overwrite AI-generated context with task completion noise.
      if (milestone.context) return;

      const tasks = await this.tasksService.getAllByMilestoneId(
        payload.milestoneId,
      );
      const remaining = tasks.filter((t) => t.status !== 'completed');

      if (remaining.length === 0) return;

      const next = remaining[0];
      milestone.context = `- Next: ${next.title}`;
      await this.milestonesService.update(milestone);

      this.logger.log(
        `Milestone context seeded for "${milestone.title}" (${payload.milestoneId})`,
      );
    } catch (err) {
      this.logger.error(
        'Failed to update milestone context after task completion',
        err,
      );
    }
  }
}
