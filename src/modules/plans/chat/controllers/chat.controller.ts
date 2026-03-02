import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { AuthUser } from '../../../../shared/decorators/auth.decorator';
import { ZodValidationPipe } from '../../../../shared/pipes/zod-validation.pipe';
import { ProjectByIdPipe } from '../../projects/pipes/project-by-id.pipe';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../../users/entities/user.entity';
import { ChatService } from '../services/chat.service';
import { mapChatToEntity } from '../mappers/mapChatToEntity';
import {
  ChatStreamEvent,
  CREATE_CHAT_SCHEMA,
  CreateChatData,
  PendingProposal,
  PROPOSAL_ACTION_SCHEMA,
  ProposalActionData,
  SEND_CHAT_MESSAGE_SCHEMA,
  SendChatMessageData,
} from '../types/entity';
import { ActiveProjectByIdPipe } from '../../projects/pipes/active-project-by-id.pipe';

@Controller('projects/:projectId/chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getAllChats(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const chats = await this.chatService.getAllByProjectId({
      projectId: project.id,
      userId: user.id,
    });

    return chats.map(mapChatToEntity);
  }

  @Post()
  async createChat(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @Body(new ZodValidationPipe(CREATE_CHAT_SCHEMA)) data: CreateChatData,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    if (!project.soul) {
      throw new BadRequestException(
        'Project soul is required to use chat. Please generate the soul first.',
      );
    }

    const chat = await this.chatService.create({
      projectId: project.id,
      userId: user.id,
      context: data.context,
    });

    return mapChatToEntity(chat);
  }

  @Get(':chatId')
  async getChat(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const chat = await this.chatService.getOneByIdOrThrow(chatId);

    if (chat.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    return mapChatToEntity(chat);
  }

  @Post(':chatId')
  async sendMessage(
    @Param('projectId', ActiveProjectByIdPipe) project: Project,
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Body(new ZodValidationPipe(SEND_CHAT_MESSAGE_SCHEMA))
    data: SendChatMessageData,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    if (!project.soul) {
      throw new BadRequestException(
        'Project soul is required to use chat. Please generate the soul first.',
      );
    }

    const chat = await this.chatService.getOneByIdOrThrow(chatId);

    if (chat.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const isFirstExchange = chat.messages.length === 0;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let aborted = false;
    req.on('close', () => {
      aborted = true;
    });

    let accumulated = '';
    const proposals: PendingProposal[] = [];

    try {
      const { stream } = await this.chatService.sendMessageStream({
        chat,
        message: data.message,
        soul: project.soul,
      });

      for await (const event of stream) {
        if (aborted) break;

        switch (event.type) {
          case 'chunk': {
            accumulated += event.content;
            const chunkEvent: ChatStreamEvent = {
              type: 'chunk',
              content: event.content,
            };
            res.write(`data: ${JSON.stringify(chunkEvent)}\n\n`);
            break;
          }
          case 'proposal': {
            const proposal = this.chatService.buildProposal({
              description: event.description,
              toolCallId: event.toolCallId,
            });
            proposals.push(proposal);
            const confirmEvent: ChatStreamEvent = {
              type: 'confirm',
              proposalId: proposal.id,
              description: proposal.description,
            };
            res.write(`data: ${JSON.stringify(confirmEvent)}\n\n`);
            break;
          }
        }
      }

      let messageId: string | undefined;
      if (accumulated) {
        const saved = await this.chatService.saveAssistantMessage(
          chatId,
          accumulated,
          proposals,
        );
        messageId = saved.id;
      }

      let chatName: string | undefined;
      if (isFirstExchange && accumulated) {
        chatName =
          (await this.chatService.generateAndSaveName(chatId)) ?? undefined;
      }

      if (!aborted) {
        const doneEvent: ChatStreamEvent = {
          type: 'done',
          messageId: messageId ?? null,
          ...(chatName ? { chatName } : {}),
        };
        res.write(`data: ${JSON.stringify(doneEvent)}\n\n`);
      }
    } catch (error) {
      let messageId: string | null = null;
      if (accumulated) {
        const saved = await this.chatService.saveAssistantMessage(
          chatId,
          accumulated,
          proposals,
        );
        messageId = saved.id;
      }

      if (!aborted) {
        const errorEvent: ChatStreamEvent = { type: 'error', messageId };
        res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
      }
    } finally {
      res.end();
    }
  }

  @Post(':chatId/proposals/:proposalId/approve')
  async approveProposal(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @Body(new ZodValidationPipe(PROPOSAL_ACTION_SCHEMA))
    _data: ProposalActionData,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const chat = await this.chatService.getOneByIdOrThrow(chatId);
    if (chat.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    await this.chatService.approveProposal({
      chatId,
      proposalId,
      projectId: project.id,
    });

    return { status: 'approved' };
  }

  @Post(':chatId/proposals/:proposalId/reject')
  async rejectProposal(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @Body(new ZodValidationPipe(PROPOSAL_ACTION_SCHEMA))
    _data: ProposalActionData,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const chat = await this.chatService.getOneByIdOrThrow(chatId);
    if (chat.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    await this.chatService.rejectProposal({ chatId, proposalId });

    return { status: 'rejected' };
  }

  @Delete(':chatId')
  async deleteChat(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const chat = await this.chatService.getOneByIdOrThrow(chatId);

    if (chat.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    return this.chatService.softDelete(chatId);
  }
}
