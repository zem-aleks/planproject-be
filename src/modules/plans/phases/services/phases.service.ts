import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase } from '../entities/phase.entity';
import { MilestonesService } from '../../milestones/services/milestones.service';
import { TasksService } from '../../tasks/services/tasks.service';
import { Project } from '../../projects/entities/project.entity';

@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(Phase)
    private readonly repository: Repository<Phase>,

    private readonly milestonesService: MilestonesService,
    private readonly tasksService: TasksService,
  ) {}

  async create(
    data: Omit<Phase, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Phase> {
    return this.repository.save(data);
  }

  async createMany(
    data: Array<Omit<Phase, 'id' | 'createdAt' | 'updatedAt' | 'milestones'>>,
  ): Promise<Phase[]> {
    return this.repository.save(data);
  }

  async update(data: Omit<Phase, 'milestones'>) {
    return this.repository.save(data);
  }

  async getAll(projectId: string) {
    return this.repository.find({
      where: { projectId },
      order: { timelineStartDay: 'ASC' },
    });
  }

  async getAllWithMilestones(projectId: string) {
    return this.repository.find({
      where: { projectId },
      order: { timelineStartDay: 'ASC' },
      relations: ['milestones'],
    });
  }

  async getFirstNotStarted(projectId: string) {
    return this.repository.findOne({
      where: { projectId, status: 'notStarted' },
      order: { timelineStartDay: 'ASC' },
    });
  }

  async getOneById(phaseId: string) {
    return this.repository.findOne({ where: { id: phaseId } });
  }

  async getOneByIdOrThrow(phaseId: string) {
    const phase = await this.getOneById(phaseId);
    if (!phase) {
      throw new NotFoundException('Phase not found');
    }
    return phase;
  }

  async softDelete(phaseId: string) {
    return this.repository.softDelete(phaseId);
  }

  async startPhase(phase: Phase, project: Project) {
    if (phase.status !== 'notStarted') {
      throw new BadRequestException('Phase cannot be started');
    }

    const milestones = await this.milestonesService.getPhaseMilestones(
      phase.id,
      true,
    );

    const [firstMilestone, ...restMilestones] = milestones;

    // we don't await for the rest milestones tasks generation
    const promises = restMilestones.map((milestone) =>
      this.tasksService.generateTasksForMilestone({
        project,
        phase,
        milestone,
        phaseMilestones: milestones,
      }),
    );

    const updatedPhase = await this.update({
      ...phase,
      status: 'inProgress',
      startedAt: new Date(),
    });

    if (firstMilestone) {
      await this.tasksService.generateTasksForMilestone({
        project,
        phase,
        milestone: firstMilestone,
        phaseMilestones: milestones,
      });
      const { tasks, ...firstMilestoneData } = firstMilestone;
      await this.milestonesService.update({
        ...firstMilestoneData,
        status: 'inProgress',
        startedAt: new Date(),
      });
    }

    return updatedPhase;
  }
}
