import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Chat } from '../entities/chat.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatAiService, StreamEvent } from './chat-ai.service';
import { ProjectSoul } from '../../projects/types/entity';
import { ChatContext, PendingProposal } from '../types/entity';
import { ProjectsService } from '../../projects/services/projects.service';
import { SoulQueueService } from '../../projects/services/soul-queue.service';
import { Project } from '../../projects/entities/project.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    private readonly chatAiService: ChatAiService,
    private readonly projectsService: ProjectsService,
    private readonly soulQueueService: SoulQueueService,
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

  async sendMessageStream(params: {
    chat: Chat;
    message: string;
    soul: ProjectSoul;
  }): Promise<{ stream: AsyncGenerator<StreamEvent> }> {
    await this.messageRepository.save({
      chatId: params.chat.id,
      role: 'user' as const,
      content: params.message,
    });

    const chat = await this.getOneByIdOrThrow(params.chat.id);

    const stream = this.chatAiService.streamResponseWithTools(
      chat.messages,
      params.soul,
      chat.context,
    );

    return { stream };
  }

  buildProposal(params: {
    description: string;
    toolCallId: string;
  }): PendingProposal {
    return {
      id: uuidv4(),
      toolCallId: params.toolCallId,
      description: params.description,
      status: 'pending',
      createdAt: new Date().toISOString(),
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

    const updatedProject = await this.soulQueueService.addOperation(
      params.project,
      {
        type: 'apply_proposal',
        description: proposal.description,
        proposalId: params.proposalId,
        messageId: message.id,
      },
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

  async softDelete(chatId: string) {
    return this.chatRepository.softDelete(chatId);
  }
}
