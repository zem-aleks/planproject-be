import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Shaping } from '../entities/shaping.entity';
import { AssistantMessage, UserMessage } from '../types/entity';
import { ShapingAiService } from './shaping-ai.service';
import { Project } from '../../plans/projects/entities/project.entity';
import { ProjectsService } from '../../plans/projects/services/projects.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ShapingService {
  constructor(
    @InjectRepository(Shaping)
    private readonly repository: Repository<Shaping>,
    private readonly shapingAiService: ShapingAiService,
    private readonly projectsService: ProjectsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    data: Omit<Shaping, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Shaping> {
    return this.repository.save(data);
  }

  async update(data: Shaping): Promise<Shaping> {
    return this.repository.save(data);
  }

  async updatePartial(id: string, data: Partial<Shaping>) {
    return this.repository.update(id, data);
  }

  async getAllByClientId(clientId: string) {
    return this.repository.find({ where: { clientId } });
  }

  async getByIdAndClientId(id: string, clientId: string) {
    return this.repository.findOne({ where: { id, clientId } });
  }

  async getAllNotConnectedByClientId(clientId: string) {
    return this.repository.find({ where: { clientId, userId: IsNull() } });
  }

  async getOneByProjectId({
    projectId,
    userId,
  }: {
    projectId: string;
    userId: string;
  }) {
    return this.repository.findOne({
      where: { projectId, userId },
    });
  }

  async getOneById(shapingId: string) {
    return this.repository.findOne({
      where: { id: shapingId },
    });
  }

  async getOneByIdOrThrow({
    shapingId,
    userId,
  }: {
    shapingId: string;
    userId: string;
  }) {
    const shaping = await this.repository.findOne({
      where: { id: shapingId, userId },
    });

    if (!shaping) {
      throw new NotFoundException('Shaping not found');
    }

    return shaping;
  }

  async getOneByIdAndClientIdOrThrow({
    shapingId,
    clientId,
  }: {
    shapingId: string;
    clientId: string;
  }) {
    const shaping = await this.repository.findOne({
      where: { id: shapingId, clientId },
    });

    if (!shaping) {
      throw new NotFoundException('Shaping not found');
    }

    return shaping;
  }

  async addAssistantMessage({
    shaping,
    message,
    comment,
    score,
    followUpAnswers,
  }: {
    shaping: Shaping;
    message: string;
    comment: string;
    score: number;
    followUpAnswers: string[];
  }) {
    const assistantMessageId =
      Math.max(...shaping.messages.map((msg) => msg.id)) + 1;

    const assistantMessage: AssistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: message,
      comment,
      answers: followUpAnswers,
    };

    return this.repository.save({
      ...shaping,
      score,
      messages: [...shaping.messages, assistantMessage],
    });
  }

  async addUserMessage({
    shaping,
    message,
  }: {
    shaping: Shaping;
    message: string;
  }): Promise<Shaping> {
    const messageId =
      shaping.messages.length > 0
        ? Math.max(...shaping.messages.map((msg) => msg.id)) + 1
        : 1;

    const userMessage: UserMessage = {
      id: messageId,
      role: 'user',
      content: message,
    };

    return this.repository.save({
      ...shaping,
      messages: [...shaping.messages, userMessage],
    });
  }

  async softDelete(assistantId: string) {
    return this.repository.softDelete(assistantId);
  }

  async processShaping(shaping: Shaping, projectId: string) {
    if (shaping.status !== 'started' && shaping.status !== 'error') {
      throw new BadRequestException('Shaping is already in progress...');
    }

    await this.updatePartial(shaping.id, {
      status: 'processing',
    });

    try {
      const projectSummary =
        await this.shapingAiService.summarizeProjectDescription(shaping);

      const data: Partial<Shaping> = {
        projectId,
        status: 'finished',
      };
      await this.updatePartial(shaping.id, data);

      const updatedShaping = { ...shaping, ...data };

      return { shaping: updatedShaping, summary: projectSummary };
    } catch (e) {
      await this.updatePartial(shaping.id, {
        status: 'error',
      });
      throw new InternalServerErrorException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  async startProjectShaping({
    project,
    shaping,
  }: {
    project: Project;
    shaping: Shaping;
  }) {
    const { shaping: updatedShaping, summary } = await this.processShaping(
      shaping,
      project.id,
    );
    const shapingProjectData: Partial<Project> = {
      title: summary.projectTitle,
      description: summary.projectDescription,
      summary: summary.projectSummary,
      clientId: shaping.clientId,
      shapingId: shaping.id,
      status: 'shaping',
      logoUrl: 'loading',
    };

    const updatedProject = { ...project, ...shapingProjectData };
    await this.projectsService.updatePartial(project.id, shapingProjectData);

    // notify other modules that we started the shaping
    this.eventEmitter.emit('project.shaping.started', {
      project: updatedProject,
      shaping: updatedShaping,
    });

    return updatedProject;
  }
}
