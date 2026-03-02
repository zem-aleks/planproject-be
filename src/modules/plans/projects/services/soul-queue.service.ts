import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { Project } from '../entities/project.entity';
import { ChatMessage } from '../../chat/entities/chat-message.entity';
import { SoulAiService } from './soul-ai.service';
import {
  AddSoulOperationData,
  ProjectSoul,
  SoulOperation,
} from '../types/entity';

@Injectable()
export class SoulQueueService {
  private readonly logger = new Logger(SoulQueueService.name);

  constructor(
    @InjectRepository(Project)
    private readonly repository: Repository<Project>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly soulAiService: SoulAiService,
  ) {}

  async addOperation(
    project: Project,
    data: AddSoulOperationData,
  ): Promise<Project> {
    if (!project.soul) {
      throw new BadRequestException('Project has no soul');
    }

    this.validateTargetExists(project.soul, data);
    this.checkDuplicate(project.soulQueue, data);

    const operation: SoulOperation = { ...data, id: randomUUID() };
    project.soulQueue = [...project.soulQueue, operation];

    if (!project.soulQueueStartedAt) {
      project.soulQueueStartedAt = new Date();
    }

    return this.repository.save(project);
  }

  async removeOperation(
    project: Project,
    operationId: string,
  ): Promise<Project> {
    const removed = project.soulQueue.find((op) => op.id === operationId);
    if (!removed) {
      throw new NotFoundException('Operation not found in queue');
    }

    project.soulQueue = project.soulQueue.filter((op) => op.id !== operationId);

    if (project.soulQueue.length === 0) {
      project.soulQueueStartedAt = null;
    }

    if (removed.type === 'apply_proposal') {
      await this.revertProposal(removed.messageId, removed.proposalId);
    }

    return this.repository.save(project);
  }

  private async revertProposal(
    messageId: string,
    proposalId: string,
  ): Promise<void> {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId },
    });
    if (!message?.proposals?.[proposalId]) return;

    message.proposals[proposalId].status = 'pending';
    await this.chatMessageRepository.save(message);
  }

  async applyQueue(project: Project): Promise<Project> {
    if (project.soulQueue.length === 0) {
      throw new BadRequestException('Queue is empty');
    }
    if (!project.soul) {
      throw new BadRequestException('Project has no soul');
    }
    if (project.soulQueueApplying) {
      throw new BadRequestException('Queue is already being applied');
    }

    project.soulQueueApplying = true;
    await this.repository.save(project);

    try {
      const soul: ProjectSoul = JSON.parse(JSON.stringify(project.soul));
      const changeDescriptions: string[] = [];

      for (const op of project.soulQueue) {
        switch (op.type) {
          case 'answer_open_question': {
            const qIdx = soul.openQuestions.findIndex(
              (q) => q.topic === op.topic,
            );
            if (qIdx !== -1) {
              soul.openQuestions.splice(qIdx, 1);
            }
            soul.decisions.push({
              topic: op.topic,
              chosen: op.chosenOption,
              rationale: null,
            });
            changeDescriptions.push(
              `The open question "${op.topic}" was answered with: "${op.chosenOption}".`,
            );
            break;
          }
          case 'remove_open_question': {
            const qIdx = soul.openQuestions.findIndex(
              (q) => q.topic === op.topic,
            );
            if (qIdx !== -1) {
              soul.openQuestions.splice(qIdx, 1);
            }
            break;
          }
          case 'accept_assumption': {
            const aIdx = soul.assumptions.findIndex(
              (a) => a.assumption === op.assumption,
            );
            if (aIdx !== -1) {
              const assumption = soul.assumptions[aIdx];
              soul.assumptions.splice(aIdx, 1);
              soul.decisions.push({
                topic: op.assumption,
                chosen: 'Confirmed by user',
                rationale: assumption.reasoning,
              });
            } else {
              soul.decisions.push({
                topic: op.assumption,
                chosen: 'Confirmed by user',
                rationale: null,
              });
            }
            changeDescriptions.push(
              `The assumption "${op.assumption}" was confirmed by the user.`,
            );
            break;
          }
          case 'remove_assumption': {
            const aIdx = soul.assumptions.findIndex(
              (a) => a.assumption === op.assumption,
            );
            if (aIdx !== -1) {
              soul.assumptions.splice(aIdx, 1);
            }
            break;
          }
          case 'apply_proposal': {
            changeDescriptions.push(op.description);
            break;
          }
        }
      }

      let finalSoul: ProjectSoul;

      if (changeDescriptions.length > 0) {
        const combinedDescription =
          changeDescriptions.join(' ') +
          ' All direct mutations (removing items, adding decisions) have already been applied. Now check for ripple effects: do these changes affect constraints, assumptions, workstreams, resources, open questions, or other sections? Apply any necessary updates to those sections only.';

        finalSoul = await this.soulAiService.generateUpdatedSoul(
          soul,
          combinedDescription,
        );
      } else {
        finalSoul = soul;
      }

      project.soul = finalSoul;
      project.soulQueue = [];
      project.soulQueueStartedAt = null;
      project.soulQueueApplying = false;

      return this.repository.save(project);
    } catch (error) {
      project.soulQueueApplying = false;
      await this.repository.save(project);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processExpiredQueues(): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const projects = await this.repository.find({
      where: {
        soulQueueStartedAt: LessThanOrEqual(fiveMinutesAgo),
      },
    });

    for (const project of projects) {
      if (project.soulQueue.length === 0) {
        continue;
      }

      try {
        await this.applyQueue(project);
        this.logger.log(`Auto-applied soul queue for project ${project.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to auto-apply soul queue for project ${project.id}`,
          error instanceof Error ? error.stack : error,
        );
      }
    }
  }

  private validateTargetExists(
    soul: ProjectSoul,
    data: AddSoulOperationData,
  ): void {
    switch (data.type) {
      case 'answer_open_question':
      case 'remove_open_question': {
        const exists = soul.openQuestions.some((q) => q.topic === data.topic);
        if (!exists) {
          throw new NotFoundException('Open question not found');
        }
        break;
      }
      case 'accept_assumption':
      case 'remove_assumption': {
        const exists = soul.assumptions.some(
          (a) => a.assumption === data.assumption,
        );
        if (!exists) {
          throw new NotFoundException('Assumption not found');
        }
        break;
      }
      case 'apply_proposal':
        break;
    }
  }

  private checkDuplicate(
    queue: SoulOperation[],
    data: AddSoulOperationData,
  ): void {
    const isDuplicate = queue.some((op) => {
      if (op.type !== data.type) return false;

      switch (data.type) {
        case 'answer_open_question':
        case 'remove_open_question':
          return (
            (op.type === 'answer_open_question' ||
              op.type === 'remove_open_question') &&
            op.topic === data.topic
          );
        case 'accept_assumption':
        case 'remove_assumption':
          return (
            (op.type === 'accept_assumption' ||
              op.type === 'remove_assumption') &&
            op.assumption === data.assumption
          );
        case 'apply_proposal':
          return false;
      }
    });

    if (isDuplicate) {
      throw new BadRequestException('Operation already queued');
    }
  }
}
