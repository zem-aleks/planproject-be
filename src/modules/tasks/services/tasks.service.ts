import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { TasksAiService } from './tasks-ai.service';
import { Milestone } from '../../milestones/entities/milestone.entity';
import { PhasesService } from '../../phases/services/phases.service';
import { Phase } from '../../phases/entities/phase.entity';
import { Project } from '../../projects/entities/project.entity';
import { MilestonesService } from '../../milestones/services/milestones.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly repository: Repository<Task>,
    private readonly tasksAiService: TasksAiService,
    private readonly phasesService: PhasesService,
    // private readonly projectsService: ProjectsService,
    private readonly milestonesService: MilestonesService,
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
  }: {
    milestone: Milestone;
    phase: Phase;
    project: Project;
  }) {
    const phases = await this.phasesService.getAll(project.id);
    const milestones = await this.milestonesService.getAll(phase.id);
    const { tasks } = await this.tasksAiService.generateMilestoneTasks({
      project,
      phase,
      phases,
      milestone,
      milestones,
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
    return this.update(task);
  }
}
