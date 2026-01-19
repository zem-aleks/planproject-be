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
import { PhasesAiService } from './phases-ai.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getProjectDay } from '../../projects/helpers/getProjectDay';

@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(Phase)
    private readonly repository: Repository<Phase>,
    private readonly milestonesService: MilestonesService,
    private readonly projectsService: ProjectsService,
    private readonly phasesAiService: PhasesAiService,
    private eventEmitter: EventEmitter2,
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

  async activate(phase: Phase, projectDay: number) {
    if (phase.status !== 'notStarted') {
      throw new BadRequestException('Phase cannot be started');
    }

    const result = await this.update({
      ...phase,
      status: 'inProgress',
      startedAt: new Date(),
    });

    this.eventEmitter.emit('phase.started', {
      phaseId: phase.id,
      projectId: phase.projectId,
      projectDay,
    });

    return result;
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
      await this.milestonesService.completeMilestones({
        milestoneIds: notCompletedMilestones,
        projectDay: getProjectDay(project),
        projectId: project.id,
      });
    }

    const result = await this.updatePartial(phaseId, {
      status: 'completed',
      completedAt: new Date(),
    });

    this.eventEmitter.emit('phase.completed', {
      phaseId,
      projectId: project.id,
      projectDay: getProjectDay(project),
    });

    const isProjectCompleted = await this.areAllPhasesCompleted(project.id);
    if (isProjectCompleted) {
      await this.projectsService.complete(project.id, getProjectDay(project));
    }

    return result;
  }

  async generateForProject(project: Project) {
    const { projectPhases } =
      await this.phasesAiService.summarizeProjectPhases(project);
    return this.createMany(
      projectPhases.map((phase) => ({
        projectId: project.id,
        title: phase.phaseTitle,
        description: phase.phaseDescription,
        minDaysNeeded: phase.minDaysNeeded,
        maxDaysNeeded: phase.maxDaysNeeded,
        expertiseNeeded: phase.expertiseNeeded,
        timelineStartDay: phase.timelineStartDay,
        timelineEndDay: phase.timelineEndDay,
        status: 'building',
        startedAt: new Date(),
        completedAt: null,
      })),
    );
  }
}
