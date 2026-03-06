import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Project } from '../entities/project.entity';
import { ChatMessage } from '../../chat/entities/chat-message.entity';
import { SoulAiService } from './soul-ai.service';
import {
  AddSoulOperationData,
  ProjectSoul,
  SoulOperation,
} from '../types/entity';
import { PhasesService } from '../../phases/services/phases.service';
import { PhasesAiService } from '../../phases/services/phases-ai.service';
import { MilestonesService } from '../../milestones/services/milestones.service';
import { MilestonesAiService } from '../../milestones/services/milestones-ai.service';

@Injectable()
export class SoulQueueService {
  private readonly logger = new Logger(SoulQueueService.name);

  constructor(
    @InjectRepository(Project)
    private readonly repository: Repository<Project>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly dataSource: DataSource,
    private readonly soulAiService: SoulAiService,
    private readonly phasesService: PhasesService,
    private readonly phasesAiService: PhasesAiService,
    private readonly milestonesService: MilestonesService,
    private readonly milestonesAiService: MilestonesAiService,
    private readonly eventEmitter: EventEmitter2,
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

    if (
      removed.type === 'apply_proposal' ||
      removed.type === 'apply_plan_proposal' ||
      removed.type === 'generate_plan'
    ) {
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

  async cancelQueue(project: Project): Promise<Project> {
    if (project.soulQueue.length === 0 && !project.soulQueueApplying) {
      throw new BadRequestException('Queue is already empty');
    }

    // Revert all proposal-type operations back to pending
    for (const op of project.soulQueue) {
      if (
        op.type === 'apply_proposal' ||
        op.type === 'apply_plan_proposal' ||
        op.type === 'generate_plan'
      ) {
        await this.revertProposal(op.messageId, op.proposalId);
      }
    }

    await this.dataSource
      .createQueryBuilder()
      .update(Project)
      .set({
        soulQueue: [],
        soulQueueApplying: false,
        soulQueueStartedAt: null,
        soulQueueError: null,
      })
      .where('id = :id', { id: project.id })
      .execute();

    return this.repository.findOneByOrFail({ id: project.id });
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
    project.soulQueueError = null;
    await this.repository.save(project);

    const operationsToProcess = [...project.soulQueue];
    const processedOpIds: string[] = [];

    try {
      const soul: ProjectSoul = JSON.parse(JSON.stringify(project.soul));
      const changeDescriptions: string[] = [];

      for (const op of operationsToProcess) {
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
          case 'apply_plan_proposal': {
            if (op.changes.plan) {
              await this.applyPlanUpdate(project, op.changes.plan);
            }
            if (op.changes.soul) {
              changeDescriptions.push(op.changes.soul);
            }
            break;
          }
          case 'generate_plan': {
            const generatedPhases =
              await this.phasesAiService.summarizeProjectPhases(project);
            await this.phasesService.deleteForProject(project.id);
            const phases = await this.phasesService.createMany(
              generatedPhases.projectPhases.map((phase) => ({
                projectId: project.id,
                title: phase.phaseTitle,
                description: phase.phaseDescription,
                minDaysNeeded: phase.minDaysNeeded,
                maxDaysNeeded: phase.maxDaysNeeded,
                expertiseNeeded: phase.expertiseNeeded,
                timelineStartDay: phase.timelineStartDay,
                timelineEndDay: phase.timelineEndDay,
                status: 'building' as const,
                startedAt: new Date(),
                completedAt: null,
              })),
            );
            this.eventEmitter.emit('phase.createdForProject', {
              phases,
              project,
            });
            const daysNeeded = Math.max(...phases.map((p) => p.timelineEndDay));
            project.status = 'analyzing';
            project.daysNeeded = daysNeeded;
            break;
          }
        }
        processedOpIds.push(op.id);
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

      return await this.dataSource.transaction(async (manager) => {
        const freshProject = await manager.findOneByOrFail(Project, {
          id: project.id,
        });

        freshProject.soul = finalSoul;
        freshProject.soulQueue = freshProject.soulQueue.filter(
          (op) => !processedOpIds.includes(op.id),
        );
        freshProject.soulQueueApplying = false;
        freshProject.soulQueueStartedAt =
          freshProject.soulQueue.length > 0
            ? freshProject.soulQueueStartedAt
            : null;
        freshProject.status = project.status;
        freshProject.daysNeeded = project.daysNeeded;

        return manager.save(Project, freshProject);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.dataSource
        .createQueryBuilder()
        .update(Project)
        .set({ soulQueueApplying: false, soulQueueError: errorMessage })
        .where('id = :id', { id: project.id })
        .execute();
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

      if (project.soulQueueApplying) {
        await this.recoverStuckQueue(project);
        continue;
      }

      try {
        await this.applyQueue(project);
        this.logger.log(`Auto-applied soul queue for project ${project.id}`);
      } catch (error) {
        // soulQueueError is already persisted by applyQueue's catch block
        this.logger.error(
          `Failed to auto-apply soul queue for project ${project.id}`,
          error instanceof Error ? error.stack : error,
        );
      }
    }
  }

  private async recoverStuckQueue(project: Project): Promise<void> {
    const stuckMinutes =
      (Date.now() - new Date(project.updatedAt).getTime()) / 60_000;

    if (stuckMinutes < 5) {
      return;
    }

    this.logger.warn(
      `Recovering stuck queue for project ${project.id} (stuck for ${Math.round(stuckMinutes)}m)`,
    );

    await this.dataSource
      .createQueryBuilder()
      .update(Project)
      .set({ soulQueueApplying: false })
      .where('id = :id', { id: project.id })
      .execute();
  }

  private async applyPlanUpdate(project: Project, plan: string): Promise<void> {
    const oldPhases = await this.phasesService.getAll(project.id);
    const oldPhasesMap = new Map(oldPhases.map((p) => [p.id, p]));

    const { projectPhases } = await this.phasesAiService.modifyProjectPhases({
      project,
      phases: oldPhases,
      modificationMessage: plan,
    });

    const newPhasesMap = new Map(projectPhases.map((p) => [p.id, p]));
    const phasesToRemove = oldPhases.filter(({ id }) => !newPhasesMap.has(id));

    if (phasesToRemove.length > 0) {
      await this.phasesService.softDeleteMany(phasesToRemove.map((p) => p.id));
    }

    const phases = await this.phasesService.createMany(
      projectPhases.map((phaseData) => {
        const existingPhase = oldPhasesMap.get(phaseData.id || '');
        if (existingPhase) {
          return {
            ...existingPhase,
            title: phaseData.phaseTitle,
            description: phaseData.phaseDescription,
            minDaysNeeded: phaseData.minDaysNeeded,
            maxDaysNeeded: phaseData.maxDaysNeeded,
            expertiseNeeded: phaseData.expertiseNeeded,
            timelineStartDay: phaseData.timelineStartDay,
            timelineEndDay: phaseData.timelineEndDay,
            projectId: project.id,
          };
        }

        return {
          title: phaseData.phaseTitle,
          description: phaseData.phaseDescription,
          minDaysNeeded: phaseData.minDaysNeeded,
          maxDaysNeeded: phaseData.maxDaysNeeded,
          expertiseNeeded: phaseData.expertiseNeeded,
          timelineStartDay: phaseData.timelineStartDay,
          timelineEndDay: phaseData.timelineEndDay,
          projectId: project.id,
          status: 'building',
          startedAt: new Date(),
          completedAt: null,
        };
      }),
    );

    this.eventEmitter.emit('phase.updatedForProject', { phases, project });

    // Detect affected phases: new phases + modified phases
    const affectedPhases = phases.filter((phase) => {
      const oldPhase = oldPhasesMap.get(phase.id);
      if (!oldPhase) return true; // new phase
      return (
        oldPhase.title !== phase.title ||
        oldPhase.description !== phase.description
      );
    });

    for (const phase of affectedPhases) {
      const existingMilestones = await this.milestonesService.getAll(phase.id);
      const milestonesMap = new Map(existingMilestones.map((m) => [m.id, m]));

      const { updatedMilestones, removedMilestoneIds } =
        await this.milestonesAiService.modifyPhaseMilestones({
          project,
          phase,
          milestones: existingMilestones,
          modificationMessage: plan,
        });

      if (removedMilestoneIds.length > 0) {
        const validIds = removedMilestoneIds.filter((id) =>
          milestonesMap.has(id),
        );
        if (validIds.length > 0) {
          await this.milestonesService.softDeleteMany(validIds);
        }
      }

      const milestonesToSave = updatedMilestones.filter(
        (m) => !removedMilestoneIds.includes(m.id),
      );

      await this.milestonesService.createMany(
        milestonesToSave.map((milestone) => {
          const existingMilestone = milestonesMap.get(milestone.id);
          const steps = milestone.steps.map((step) => ({
            ...step,
            id: randomUUID(),
            completed: false,
          }));

          if (existingMilestone) {
            return {
              ...existingMilestone,
              ...milestone,
              steps,
              phaseId: phase.id,
              projectId: project.id,
              userId: project.userId,
            };
          }

          return {
            ...milestone,
            steps,
            phaseId: phase.id,
            projectId: project.id,
            userId: project.userId,
            status: 'notStarted',
            startedAt: new Date(),
            completeMessage: null,
            completedAt: null,
            context: null,
            focused: false,
          };
        }),
      );
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
      case 'apply_plan_proposal':
      case 'generate_plan':
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
        case 'apply_plan_proposal':
        case 'generate_plan':
          return false;
      }
    });

    if (isDuplicate) {
      throw new BadRequestException('Operation already queued');
    }
  }
}
