import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Phase } from '../entities/phase.entity';
import { MilestonesService } from '../../milestones/services/milestones.service';
import { Project } from '../../projects/entities/project.entity';
import { ProjectsService } from '../../projects/services/projects.service';

@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(Phase)
    private readonly repository: Repository<Phase>,
    private readonly milestonesService: MilestonesService,
    private readonly projectsService: ProjectsService,
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

  async updatePartial(phaseId: string, data: Partial<Phase>) {
    return this.repository.update(phaseId, data);
  }

  async getAll(projectId: string) {
    return this.repository.find({
      where: { projectId },
      order: { timelineStartDay: 'ASC', id: 'ASC' },
    });
  }

  async getAllWithMilestones(projectId: string) {
    return this.repository.find({
      where: { projectId },
      order: { timelineStartDay: 'ASC', id: 'ASC' },
      relations: ['milestones'],
    });
  }

  async getFirstNotStarted(projectId: string) {
    return this.repository.findOne({
      where: { projectId, status: 'notStarted' },
      order: { timelineStartDay: 'ASC', id: 'ASC' },
    });
  }

  async getActiveWithMilestones(projectId: string) {
    return this.repository.find({
      where: { projectId, status: 'inProgress' },
      order: { timelineStartDay: 'ASC', id: 'ASC' },
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

  async activate(phase: Phase) {
    if (phase.status !== 'notStarted') {
      throw new BadRequestException('Phase cannot be started');
    }

    return this.update({
      ...phase,
      status: 'inProgress',
      startedAt: new Date(),
    });
  }

  async areAllPhasesCompleted(projectId: string) {
    const notCompletedCount = await this.repository.count({
      where: { projectId, status: Not('completed') },
    });

    return notCompletedCount === 0;
  }

  async complete(phaseId: string, project: Project) {
    const milestones = await this.milestonesService.getPhaseMilestones(phaseId);
    const notCompletedMilestones = milestones
      .filter((m) => m.status !== 'completed')
      .map((m) => m.id);

    if (notCompletedMilestones.length > 0) {
      await this.milestonesService.completeMilestones(
        notCompletedMilestones,
        project,
      );
    }

    const isProjectCompleted = await this.areAllPhasesCompleted(project.id);
    if (isProjectCompleted) {
      await this.projectsService.complete(project.id);
    }

    return this.updatePartial(phaseId, {
      status: 'completed',
      completedAt: new Date(),
    });
  }
}
