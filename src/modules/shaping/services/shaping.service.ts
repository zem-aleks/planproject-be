import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shaping } from '../entities/shaping.entity';
import { AssistantMessage, UserMessage } from '../types/entity';

@Injectable()
export class ShapingService {
  constructor(
    @InjectRepository(Shaping)
    private readonly repository: Repository<Shaping>,
  ) {}

  async create(
    data: Omit<Shaping, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Shaping> {
    return this.repository.save(data);
  }

  async update(data: Shaping): Promise<Shaping> {
    return this.repository.save(data);
  }

  async getAllByClientId(clientId: string) {
    return this.repository.find({ where: { clientId } });
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
  }: {
    shaping: Shaping;
    message: string;
    comment: string;
    score: number;
  }) {
    const assistantMessageId =
      Math.max(...shaping.messages.map((msg) => msg.id)) + 1;

    const assistantMessage: AssistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: message,
      comment,
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
}
