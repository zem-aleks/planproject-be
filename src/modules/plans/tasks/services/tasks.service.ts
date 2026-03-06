import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Task } from '../entities/task.entity';
import { TasksAiService } from './tasks-ai.service';
import { Milestone } from '../../milestones/entities/milestone.entity';
import { Phase } from '../../phases/entities/phase.entity';
import { Project } from '../../projects/entities/project.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly repository: Repository<Task>,
    private readonly tasksAiService: TasksAiService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Task> {
    return this.repository.save(data);
  }

  async createMany(
    data: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'milestone'>>,
  ): Promise<Task[]> {
    return this.repository.save(data);
  }

  async update(data: Task): Promise<Task> {
    return this.repository.save(data);
  }

  async getAllByMilestoneId(milestoneId: string) {
    return this.repository.find({
      where: { milestoneId },
      order: { orderIndex: 'ASC' },
    });
  }

  async getAllByProjectId(projectId: string) {
    return this.repository.find({
      where: { projectId },
      order: { orderIndex: 'ASC' },
      relations: ['milestone'],
    });
  }

  async getNotCompletedByProjectId(projectId: string) {
    const activeTasks = await this.repository.find({
      where: { projectId, status: Not('completed') },
      relations: ['milestone'],
    });

    return activeTasks.sort((a, b) => {
      // 1️⃣ Sort by milestone.orderIndex first
      const milestoneOrderA =
        a.milestone?.orderIndex ?? Number.MAX_SAFE_INTEGER;
      const milestoneOrderB =
        b.milestone?.orderIndex ?? Number.MAX_SAFE_INTEGER;

      if (milestoneOrderA !== milestoneOrderB) {
        return milestoneOrderA - milestoneOrderB;
      }

      // 2️⃣ If milestones are equal, sort by task.orderIndex
      const taskOrderA = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
      const taskOrderB = b.orderIndex ?? Number.MAX_SAFE_INTEGER;

      return taskOrderA - taskOrderB;
    });
  }

  async getOneById(taskId: string) {
    return this.repository.findOne({ where: { id: taskId } });
  }

  async softDelete(taskId: string) {
    return this.repository.softDelete(taskId);
  }

  async generateTasksForMilestone({
    milestone,
    project,
    phase,
    phaseMilestones,
  }: {
    milestone: Milestone;
    phase: Phase;
    phaseMilestones: Milestone[];
    project: Project;
  }) {
    if (milestone.tasks.length > 0) {
      return milestone.tasks;
    }

    const { tasks } = await this.tasksAiService.generateMilestoneTasks({
      project,
      phase,
      milestone,
      milestones: phaseMilestones,
    });

    return this.createMany(
      tasks.map((task) => ({
        ...task,
        milestoneId: milestone.id,
        phaseId: milestone.phaseId,
        projectId: phase.projectId,
        status: 'notStarted',
        completedAt: null,
        completeMessage: null,
      })),
    );
  }

  async completeTask({ task, message }: { task: Task; message: string }) {
    task.status = 'completed';
    task.completeMessage = message;
    task.completedAt = new Date();
    const result = await this.update(task);

    this.eventEmitter.emit('task.completed', {
      taskId: task.id,
      taskTitle: task.title,
      milestoneId: task.milestoneId,
      projectId: task.projectId,
      message,
    });

    return result;
  }
}
