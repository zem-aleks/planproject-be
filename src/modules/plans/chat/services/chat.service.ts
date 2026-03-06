import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Chat } from '../entities/chat.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatAiService, StreamEvent, ToolExecutor } from './chat-ai.service';
import { ProjectSoul } from '../../projects/types/entity';
import { ChatContext, PendingProposal, ProposalChanges } from '../types/entity';
import { SoulQueueService } from '../../projects/services/soul-queue.service';
import { Project } from '../../projects/entities/project.entity';
import { PhasesService } from '../../phases/services/phases.service';
import { MilestonesService } from '../../milestones/services/milestones.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { CompetitorsService } from '../../../competitors/services/competitors.service';
import { AuditoryService } from '../../../auditory/services/auditory.service';
import { TasksService } from '../../tasks/services/tasks.service';
import { getProjectDay } from '../../projects/helpers/getProjectDay';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    private readonly chatAiService: ChatAiService,
    private readonly soulQueueService: SoulQueueService,
    private readonly phasesService: PhasesService,
    private readonly milestonesService: MilestonesService,
    private readonly projectsService: ProjectsService,
    private readonly competitorsService: CompetitorsService,
    private readonly auditoryService: AuditoryService,
    private readonly tasksService: TasksService,
  ) {}

  async getAllByProjectId(params: {
    projectId: string;
    userId: string;
  }): Promise<Chat[]> {
    return this.chatRepository.find({
      where: { projectId: params.projectId, userId: params.userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getOneById(chatId: string): Promise<Chat | null> {
    return this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }

  async getOneByIdOrThrow(chatId: string): Promise<Chat> {
    const chat = await this.getOneById(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return chat;
  }

  async create(params: {
    projectId: string;
    userId: string;
    context?: ChatContext;
  }): Promise<Chat> {
    const chat = await this.chatRepository.save({
      projectId: params.projectId,
      userId: params.userId,
      context: params.context ?? null,
    });
    chat.messages = [];
    return chat;
  }

  async searchMessages(
    projectId: string,
    query: string,
  ): Promise<ChatMessage[]> {
    return this.messageRepository.find({
      where: {
        chat: { projectId },
        content: ILike(`%${query}%`),
      },
      relations: ['chat'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  createToolExecutor(project: Project): ToolExecutor {
    const projectId = project.id;

    return async (name: string, args: Record<string, unknown>) => {
      switch (name) {
        case 'search_chats': {
          const query = args.query as string;
          const messages = await this.searchMessages(projectId, query);
          if (messages.length === 0) {
            return `No messages found matching "${query}".`;
          }
          return messages
            .map(
              (m) =>
                `[${m.role}] (chat: ${m.chat?.name ?? 'unnamed'}, ${m.createdAt.toISOString()}): ${m.content.slice(0, 300)}`,
            )
            .join('\n---\n');
        }
        case 'load_phases': {
          const phases = await this.phasesService.getAll(projectId);
          if (phases.length === 0) {
            return 'No phases found for this project.';
          }
          return phases
            .map(
              (p) =>
                `- **${p.title}** (${p.status}) — ${p.description ?? 'No description'}. Days ${p.timelineStartDay}–${p.timelineEndDay}.`,
            )
            .join('\n');
        }
        case 'load_milestones': {
          const phaseId = args.phaseId as string | undefined;
          const milestones = phaseId
            ? await this.milestonesService.getAll(phaseId)
            : await this.milestonesService.getAllByProject(projectId);
          if (milestones.length === 0) {
            return phaseId
              ? 'No milestones found for this phase.'
              : 'No milestones found for this project.';
          }
          return milestones
            .map((m) => {
              const lines = [
                `- **${m.title}** (id: ${m.id}, ${m.status}) — ${m.description}. Definition of done: ${m.definitionOfDone}. ~${m.daysNeeded} days.`,
              ];
              if (m.context) {
                lines.push(`  Context: ${m.context}`);
              }
              if (m.steps.length > 0) {
                lines.push(
                  `  Steps: ${m.steps.map((s) => `${s.completed ? '[x]' : '[ ]'} ${s.title} (id: ${s.id})`).join('; ')}`,
                );
              }
              return lines.join('\n');
            })
            .join('\n');
        }
        case 'load_chats': {
          const chats = await this.chatRepository.find({
            where: { projectId },
            order: { createdAt: 'DESC' },
          });
          if (chats.length === 0) {
            return 'No chats found for this project.';
          }
          return chats
            .map(
              (c) =>
                `- **${c.name ?? 'Unnamed chat'}** (id: ${c.id}) — context: ${c.context?.type ?? 'general'}, created: ${c.createdAt.toISOString()}`,
            )
            .join('\n');
        }
        case 'load_chat_messages': {
          const chatId = args.chatId as string;
          const chat = await this.getOneById(chatId);
          if (!chat) {
            return `Chat not found: ${chatId}`;
          }
          if (chat.messages.length === 0) {
            return 'This chat has no messages.';
          }
          return chat.messages
            .map(
              (m) =>
                `[${m.role}] (${m.createdAt.toISOString()}): ${m.content.slice(0, 500)}`,
            )
            .join('\n---\n');
        }
        case 'unlock_section': {
          const section = args.section as 'competitors' | 'auditory';
          const flag =
            section === 'competitors'
              ? 'competitorsUnlocked'
              : 'auditoryUnlocked';

          if (project[flag]) {
            return `The ${section} section is already unlocked.`;
          }

          await this.projectsService.updatePartial(projectId, {
            [flag]: true,
          });
          project[flag] = true;

          if (section === 'competitors') {
            try {
              const competitors =
                await this.competitorsService.generateForProject(project);
              const formatted = competitors
                .map(
                  (c) =>
                    `- **${c.title}** (rating: ${c.competitionRating}/100)\n  ${c.description}\n  Why competitor: ${c.whyCompetitor}${c.url ? `\n  URL: ${c.url}` : ''}${c.usp ? `\n  USP: ${c.usp}` : ''}`,
                )
                .join('\n\n');
              return `Competitors section unlocked and generated. Here are the results:\n\n${formatted}\n\nUse this data to answer the user's question. Continue your response.`;
            } catch (err) {
              this.logger.error('Failed to generate competitors', err);
              return 'Competitors section unlocked but generation failed. Continue your response and let the user know.';
            }
          } else {
            try {
              await this.auditoryService.generateForProject(project);
              const auditory = await this.auditoryService.find(projectId);
              const lines: string[] = [];
              if (auditory?.tam) lines.push(`**TAM:** ${auditory.tam}`);
              if (auditory?.sam) lines.push(`**SAM:** ${auditory.sam}`);
              if (auditory?.som) lines.push(`**SOM:** ${auditory.som}`);
              if (auditory?.auditoryDemands)
                lines.push(`**Demands:** ${auditory.auditoryDemands}`);
              if (auditory?.auditoryPains)
                lines.push(`**Pains:** ${auditory.auditoryPains}`);
              if (auditory?.differentiation)
                lines.push(`**Differentiation:** ${auditory.differentiation}`);
              if (auditory?.auditoryChannels)
                lines.push(`**Channels:** ${auditory.auditoryChannels}`);
              const formatted =
                lines.length > 0
                  ? lines.join('\n')
                  : 'Data generated but fields are still populating.';
              return `Auditory section unlocked and generated. Here are the results:\n\n${formatted}\n\nUse this data to answer the user's question. Continue your response.`;
            } catch (err) {
              this.logger.error('Failed to generate auditory', err);
              return 'Auditory section unlocked but generation failed. Continue your response and let the user know.';
            }
          }
        }
        case 'load_competitors': {
          if (!project.competitorsUnlocked) {
            return 'Competitors section is not unlocked yet. Use unlock_section to unlock it first.';
          }
          const competitors = await this.competitorsService.getAll(projectId);
          if (competitors.length === 0) {
            return 'No competitors found. They may still be generating.';
          }
          return competitors
            .map(
              (c) =>
                `- **${c.title}** (id: ${c.id}, rating: ${c.competitionRating}/100)\n  ${c.description}\n  Why competitor: ${c.whyCompetitor}${c.url ? `\n  URL: ${c.url}` : ''}${c.usp ? `\n  USP: ${c.usp}` : ''}${c.usersStats ? `\n  Users/Stats: ${c.usersStats}` : ''}${c.experienceToReuse ? `\n  Experience to reuse: ${c.experienceToReuse}` : ''}`,
            )
            .join('\n\n');
        }

        case 'load_auditory': {
          if (!project.auditoryUnlocked) {
            return 'Auditory section is not unlocked yet. Use unlock_section to unlock it first.';
          }
          const auditory = await this.auditoryService.find(projectId);
          if (!auditory) {
            return 'No auditory data found. It may still be generating.';
          }
          const lines: string[] = [];
          if (auditory.tam) lines.push(`**TAM:** ${auditory.tam}`);
          if (auditory.sam) lines.push(`**SAM:** ${auditory.sam}`);
          if (auditory.som) lines.push(`**SOM:** ${auditory.som}`);
          if (auditory.auditoryDemands)
            lines.push(`**Demands:** ${auditory.auditoryDemands}`);
          if (auditory.auditoryPains)
            lines.push(`**Pains:** ${auditory.auditoryPains}`);
          if (auditory.differentiation)
            lines.push(`**Differentiation:** ${auditory.differentiation}`);
          if (auditory.auditoryChannels)
            lines.push(`**Channels:** ${auditory.auditoryChannels}`);
          if (auditory.menPercentage !== null)
            lines.push(`**Men %:** ${auditory.menPercentage}%`);
          return lines.length > 0
            ? lines.join('\n')
            : 'Auditory data exists but fields are still empty. It may still be generating.';
        }
        case 'update_competitors': {
          const competitorId = args.competitorId as string;
          const field = args.field as string;
          const value = args.value as string;
          const updateData: Record<string, unknown> =
            field === 'competitionRating'
              ? { [field]: parseInt(value, 10) }
              : { [field]: value };
          await this.competitorsService.updatePartial(competitorId, updateData);
          return `Competitor ${field} updated successfully.`;
        }
        case 'update_auditory': {
          const field = args.field as string;
          const value = args.value as string;
          const auditory = await this.auditoryService.find(projectId);
          if (!auditory) {
            return 'No auditory data found. Unlock the auditory section first.';
          }
          await this.auditoryService.updatePartial(auditory.id, {
            [field]: value,
          });
          return `Auditory ${field} updated successfully.`;
        }
        case 'load_tasks': {
          const milestoneId = args.milestoneId as string;
          const tasks =
            await this.tasksService.getAllByMilestoneId(milestoneId);
          if (tasks.length === 0) {
            return 'No tasks found for this milestone.';
          }
          return tasks
            .map(
              (t) =>
                `- **${t.title}** (id: ${t.id}, ${t.status}) — ${t.description}. Definition of done: ${t.definitionOfDone}.`,
            )
            .join('\n');
        }
        case 'complete_step': {
          const milestoneId = args.milestoneId as string;
          const stepId = args.stepId as string;
          const milestone =
            await this.milestonesService.getOneById(milestoneId);
          if (!milestone) return `Milestone not found: ${milestoneId}`;
          const stepIndex = milestone.steps.findIndex((s) => s.id === stepId);
          if (stepIndex === -1) return `Step not found: ${stepId}`;
          milestone.steps = milestone.steps.map((step, i) =>
            i === stepIndex ? { ...step, completed: !step.completed } : step,
          );
          await this.milestonesService.update(milestone);
          const toggled = milestone.steps[stepIndex];
          return `Step "${toggled.title}" marked as ${toggled.completed ? 'completed' : 'not completed'}.`;
        }
        case 'complete_milestone': {
          const milestoneId = args.milestoneId as string;
          const message = args.message as string;
          const milestone =
            await this.milestonesService.getOneById(milestoneId);
          if (!milestone) return `Milestone not found: ${milestoneId}`;
          if (milestone.status === 'completed')
            return 'Milestone is already completed.';
          const projectDay = getProjectDay(project);
          await this.milestonesService.completeMilestone({
            milestone,
            message,
            projectDay,
          });
          return `Milestone "${milestone.title}" completed successfully.`;
        }
        case 'complete_task': {
          const taskId = args.taskId as string;
          const message = args.message as string;
          const task = await this.tasksService.getOneById(taskId);
          if (!task) return `Task not found: ${taskId}`;
          if (task.status === 'completed') return 'Task is already completed.';
          await this.tasksService.completeTask({ task, message });
          return `Task "${task.title}" completed successfully.`;
        }
        case 'update_milestone': {
          const milestoneId = args.milestoneId as string;
          const field = args.field as
            | 'title'
            | 'description'
            | 'definitionOfDone'
            | 'usefulResources'
            | 'context';
          const value = args.value as string;
          const milestone =
            await this.milestonesService.getOneById(milestoneId);
          if (!milestone) return `Milestone not found: ${milestoneId}`;
          milestone[field] = value;
          await this.milestonesService.update(milestone);
          return `Milestone ${field} updated successfully.`;
        }
        case 'update_step': {
          const milestoneId = args.milestoneId as string;
          const stepId = args.stepId as string;
          const field = args.field as string;
          const value = args.value as string;
          const milestone =
            await this.milestonesService.getOneById(milestoneId);
          if (!milestone) return `Milestone not found: ${milestoneId}`;
          const stepIdx = milestone.steps.findIndex((s) => s.id === stepId);
          if (stepIdx === -1) return `Step not found: ${stepId}`;
          milestone.steps = milestone.steps.map((step, i) =>
            i === stepIdx ? { ...step, [field]: value } : step,
          );
          await this.milestonesService.update(milestone);
          return `Step ${field} updated successfully.`;
        }
        case 'update_task': {
          const taskId = args.taskId as string;
          const field = args.field as
            | 'title'
            | 'description'
            | 'definitionOfDone'
            | 'usefulResources'
            | 'examples';
          const value = args.value as string;
          const task = await this.tasksService.getOneById(taskId);
          if (!task) return `Task not found: ${taskId}`;
          task[field] = value;
          await this.tasksService.update(task);
          return `Task ${field} updated successfully.`;
        }
        default:
          return `Unknown tool: ${name}`;
      }
    };
  }

  private async resolveEntityDetails(
    context: ChatContext | null,
  ): Promise<string | undefined> {
    if (!context?.entityId) return undefined;

    switch (context.type) {
      case 'milestone': {
        const milestone = await this.milestonesService.getOneById(
          context.entityId,
        );
        if (!milestone) return undefined;
        const lines = [
          `**Milestone: ${milestone.title}** (id: ${milestone.id}, ${milestone.status})`,
          `- Description: ${milestone.description}`,
          `- Definition of done: ${milestone.definitionOfDone}`,
          `- Days needed: ~${milestone.daysNeeded}`,
        ];
        if (milestone.context) lines.push(`- Context: ${milestone.context}`);
        if (milestone.usefulResources)
          lines.push(`- Resources: ${milestone.usefulResources}`);
        if (milestone.steps.length > 0) {
          lines.push(`- Steps:`);
          for (const step of milestone.steps) {
            lines.push(
              `  - ${step.completed ? '[x]' : '[ ]'} ${step.title} (id: ${step.id}) — ${step.description}`,
            );
          }
        }
        return lines.join('\n');
      }
      case 'task': {
        const task = await this.tasksService.getOneById(context.entityId);
        if (!task) return undefined;
        const lines = [
          `**Task: ${task.title}** (id: ${task.id}, ${task.status})`,
          `- Description: ${task.description}`,
          `- Definition of done: ${task.definitionOfDone}`,
        ];
        if (task.usefulResources)
          lines.push(`- Resources: ${task.usefulResources}`);
        if (task.examples) lines.push(`- Examples: ${task.examples}`);
        return lines.join('\n');
      }
      case 'phase': {
        const phase = await this.phasesService.getOneById(context.entityId);
        if (!phase) return undefined;
        const lines = [
          `**Phase: ${phase.title}** (id: ${phase.id}, ${phase.status})`,
          `- Description: ${phase.description ?? 'No description'}`,
          `- Timeline: days ${phase.timelineStartDay}–${phase.timelineEndDay}`,
        ];
        return lines.join('\n');
      }
      default:
        return undefined;
    }
  }

  async sendMessageStream(params: {
    chat: Chat;
    message: string;
    soul: ProjectSoul;
    project: Project;
  }): Promise<{ stream: AsyncGenerator<StreamEvent> }> {
    await this.messageRepository.save({
      chatId: params.chat.id,
      role: 'user' as const,
      content: params.message,
    });

    const chat = await this.getOneByIdOrThrow(params.chat.id);
    const toolExecutor = this.createToolExecutor(params.project);
    const entityDetails = await this.resolveEntityDetails(chat.context);

    const stream = this.chatAiService.streamResponseWithTools(
      chat.messages,
      params.soul,
      chat.context,
      toolExecutor,
      entityDetails,
    );

    return { stream };
  }

  buildProposal(params: {
    description: string;
    toolCallId: string;
    toolName: string;
    changes?: ProposalChanges;
  }): PendingProposal {
    return {
      id: uuidv4(),
      toolCallId: params.toolCallId,
      toolName: params.toolName,
      description: params.description,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...(params.changes ? { changes: params.changes } : {}),
    };
  }

  async saveAssistantMessage(
    chatId: string,
    content: string,
    proposals?: PendingProposal[],
  ): Promise<ChatMessage> {
    const proposalsMap =
      proposals && proposals.length > 0
        ? Object.fromEntries(proposals.map((p) => [p.id, p]))
        : null;

    return this.messageRepository.save({
      chatId,
      role: 'assistant' as const,
      content,
      proposals: proposalsMap,
    });
  }

  async approveProposal(params: {
    chatId: string;
    proposalId: string;
    project: Project;
  }): Promise<Project> {
    const chat = await this.getOneByIdOrThrow(params.chatId);

    const message = chat.messages.find(
      (m) => m.proposals && m.proposals[params.proposalId],
    );
    if (!message) throw new NotFoundException('Proposal not found');

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const proposal = message.proposals![params.proposalId];
    if (proposal.status !== 'pending') {
      throw new BadRequestException(`Proposal already ${proposal.status}`);
    }

    const operation =
      proposal.toolName === 'generate_plan'
        ? {
            type: 'generate_plan' as const,
            description: proposal.description,
            proposalId: params.proposalId,
            messageId: message.id,
          }
        : {
            type: 'apply_plan_proposal' as const,
            description: proposal.description,
            proposalId: params.proposalId,
            messageId: message.id,
            changes: proposal.changes ?? { soul: proposal.description },
          };

    const updatedProject = await this.soulQueueService.addOperation(
      params.project,
      operation,
    );

    proposal.status = 'approved';
    await this.messageRepository.save(message);

    return updatedProject;
  }

  async rejectProposal(params: {
    chatId: string;
    proposalId: string;
  }): Promise<void> {
    const chat = await this.getOneByIdOrThrow(params.chatId);

    const message = chat.messages.find(
      (m) => m.proposals && m.proposals[params.proposalId],
    );
    if (!message) throw new NotFoundException('Proposal not found');

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const proposal = message.proposals![params.proposalId];
    if (proposal.status !== 'pending') {
      throw new BadRequestException(`Proposal already ${proposal.status}`);
    }

    proposal.status = 'rejected';
    await this.messageRepository.save(message);
  }

  async generateAndSaveName(chatId: string): Promise<string | null> {
    const chat = await this.getOneByIdOrThrow(chatId);
    if (chat.name) return null;

    const name = await this.chatAiService.generateChatName(chat.messages);
    await this.chatRepository.update(chatId, { name });
    return name;
  }

  async updateMilestoneContextAfterChat(chatId: string): Promise<void> {
    const chat = await this.getOneByIdOrThrow(chatId);
    if (!chat.context?.entityId) {
      this.logger.debug(
        `Skipping milestone context update: no entityId (chat ${chatId})`,
      );
      return;
    }
    if (chat.messages.length < 2) {
      this.logger.debug(
        `Skipping milestone context update: <2 messages (chat ${chatId})`,
      );
      return;
    }

    let milestoneId: string | undefined;

    if (chat.context.type === 'milestone') {
      milestoneId = chat.context.entityId;
    } else if (chat.context.type === 'task') {
      const task = await this.tasksService.getOneById(chat.context.entityId);
      if (task) milestoneId = task.milestoneId;
    }

    if (!milestoneId) {
      this.logger.debug(
        `Skipping milestone context update: could not resolve milestoneId (chat ${chatId}, type=${chat.context.type})`,
      );
      return;
    }

    const milestone = await this.milestonesService.getOneById(milestoneId);
    if (!milestone) {
      this.logger.debug(
        `Skipping milestone context update: milestone not found ${milestoneId}`,
      );
      return;
    }

    this.logger.log(
      `Generating milestone context update for "${milestone.title}" (${milestoneId}) from chat ${chatId}`,
    );

    const updatedContext = await this.chatAiService.generateMilestoneContext({
      messages: chat.messages,
      milestoneTitle: milestone.title,
      milestoneDescription: milestone.description,
      currentContext: milestone.context,
    });

    if (updatedContext && updatedContext !== milestone.context) {
      milestone.context = updatedContext;
      await this.milestonesService.update(milestone);
      this.logger.log(
        `Milestone context updated for "${milestone.title}" (${milestoneId})`,
      );
    } else {
      this.logger.debug(
        `Milestone context unchanged for "${milestone.title}" (${milestoneId})`,
      );
    }
  }

  async softDelete(chatId: string) {
    return this.chatRepository.softDelete(chatId);
  }
}
