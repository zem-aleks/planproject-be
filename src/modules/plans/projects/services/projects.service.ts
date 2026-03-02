import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import * as dayjs from 'dayjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Shaping } from '../../../shaping/entities/shaping.entity';
import { SoulAiService } from './soul-ai.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly repository: Repository<Project>,
    private eventEmitter: EventEmitter2,
    private readonly soulAiService: SoulAiService,
  ) {}

  async create(
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'startedAt'>,
  ): Promise<Project> {
    return this.repository.save(data);
  }

  async update(data: Project): Promise<Project> {
    return this.repository.save(data);
  }

  async updatePartial(projectId: string, data: Partial<Project>) {
    return this.repository.update(projectId, data);
  }

  async getAll(userId: string) {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getOneById(projectId: string) {
    return this.repository.findOne({ where: { id: projectId } });
  }

  async getOneByIdOrThrow(projectId: string) {
    const project = await this.getOneById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async getOneByShapingId(shapingId: string) {
    return this.repository.findOne({ where: { shapingId } });
  }

  async softDelete(projectId: string) {
    return this.repository.softDelete(projectId);
  }

  async activate(projectId: string, projectDay: number) {
    const result = await this.updatePartial(projectId, {
      status: 'active',
      startedAt: new Date(),
    });

    this.eventEmitter.emit('project.started', { projectId, projectDay });

    return result;
  }

  async complete(projectId: string, projectDay: number) {
    const result = await this.updatePartial(projectId, {
      status: 'completed',
      completedAt: new Date(),
    });

    this.eventEmitter.emit('project.completed', { projectId, projectDay });

    return result;
  }

  async createDraft({
    shapingId,
    clientId,
    userId,
  }: {
    shapingId: string;
    clientId: string;
    userId: string | null;
  }) {
    const projectName = `New project (${dayjs().format('YYYY-MM-DD HH:mm')})`;
    return this.create({
      title: projectName,
      clientId,
      shapingId,
      userId,
      status: 'draft',
      description: null,
      summary: null,
      logoUrl: null,
      daysNeeded: null,
      completedAt: null,
      soul: null,
      soulQueue: [],
      soulQueueStartedAt: null,
      soulQueueApplying: false,
      activated: false,
    });
  }

  async activatedProjectsCount(userId: string) {
    return this.repository.count({ where: { userId, activated: true } });
  }

  async generateSoul(project: Project, shaping: Shaping): Promise<Project> {
    try {
      await this.updatePartial(project.id, {
        status: 'soulBuilding',
      });
      const soul = await this.soulAiService.generateSoul(project, shaping);
      await this.updatePartial(project.id, {
        soul: soul,
        status: 'soulDone',
      });
      return { ...project, soul, status: 'soulDone' };
    } catch (error) {
      await this.updatePartial(project.id, {
        status: 'soulError',
      });
      return { ...project, status: 'soulError' };
    }
  }
}
