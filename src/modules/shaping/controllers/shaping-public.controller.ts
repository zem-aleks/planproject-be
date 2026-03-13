import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ShapingService } from '../services/shaping.service';
import { mapShapingToEntity } from '../mappers/mapShapingToEntity';
import { ShapingAiService } from '../services/shaping-ai.service';
import { ProjectsService } from '../../plans/projects/services/projects.service';
import { mapProjectToEntity } from '../../plans/projects/mappers/mapProjectToEntity';
import { SupabaseStorageService } from '../../supabase/supabase-storage.service';
import { ProjectByIdPipe } from '../../plans/projects/pipes/project-by-id.pipe';
import { Project } from '../../plans/projects/entities/project.entity';
import { notReachable } from '../../../shared/utils/notReachable';
import { ProjectsAiService } from '../../plans/projects/services/projects-ai.service';
import { ShapingSummary } from '../entities/shaping.entity';

@Controller('start')
export class ShapingPublicController {
  readonly logoPath: string;

  constructor(
    private readonly shapingService: ShapingService,
    private readonly shapingAiService: ShapingAiService,
    private readonly projectsService: ProjectsService,
    private readonly projectsAiService: ProjectsAiService,
    private readonly storageService: SupabaseStorageService,
  ) {
    this.logoPath = this.storageService.getBucketUrl('logo') + '/';
  }

  @Get(':projectId/logo')
  async getLogo(@Param('projectId', ProjectByIdPipe) project: Project) {
    return mapProjectToEntity(project, this.logoPath);
  }

  @Patch(':projectId/logo')
  async generateProjectLogo(
    @Param('projectId', ProjectByIdPipe) project: Project,
    // @AuthUser() user: User,
  ) {
    // if (project.userId !== user.id) {
    //   throw new UnauthorizedException('Permissions denied');
    // }

    if (project.logoUrl && project.logoUrl !== 'loading') {
      return mapProjectToEntity(project, this.logoPath);
    }

    if (project.logoUrl !== null) {
      throw new BadRequestException(
        'Project already has a logo or generation is in progress...',
      );
    }

    await this.projectsService.updatePartial(project.id, {
      logoUrl: 'loading',
    });

    const base64 = await this.projectsAiService.generateLogo(project);
    if (!base64) {
      await this.projectsService.updatePartial(project.id, { logoUrl: null });
      return mapProjectToEntity({ ...project, logoUrl: null }, this.logoPath);
    }

    const buffer = Buffer.from(base64, 'base64');
    const imageName = `${project.id}-${Math.floor(Math.random() * 10000)}.png`;
    const uploadState = await this.storageService.upload({
      bucketId: 'logo',
      contentType: 'image/png',
      name: imageName,
      fileBody: buffer,
    });

    switch (uploadState.type) {
      case 'error': {
        await this.projectsService.updatePartial(project.id, { logoUrl: null });
        return mapProjectToEntity({ ...project, logoUrl: null }, this.logoPath);
      }

      case 'success': {
        await this.projectsService.updatePartial(project.id, {
          logoUrl: uploadState.url,
        });
        return mapProjectToEntity(
          { ...project, logoUrl: uploadState.url },
          this.logoPath,
        );
      }

      default:
        return notReachable(uploadState);
    }
  }

  @Post()
  async createShaping(
    @Body('message') message: string,
    @Body('clientId', ParseUUIDPipe) clientId: string,
  ) {
    // const shapes = await this.shapingService.getAllByClientId(clientId);
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message is required');
    }

    // if (shapes.length > 0) {
    //   throw new ForbiddenException(
    //     'You already have a started project. Only one project is available without registration.',
    //   );
    // }

    const shaping = await this.shapingService.create({
      projectId: null,
      userId: null,
      clientId,
      messages: [
        {
          id: 1,
          role: 'user',
          content: message,
        },
      ],
      score: 0,
      status: 'started',
      summaries: [],
    });

    const { followUpQuestion, followUpAnswers, assistantComment, score } =
      await this.shapingAiService.processShapingData(shaping, 'gpt-4o-mini');

    const updatedShaping = await this.shapingService.addAssistantMessage({
      shaping,
      message: followUpQuestion,
      comment: assistantComment,
      score,
      followUpAnswers,
    });

    return mapShapingToEntity(updatedShaping);
  }

  @Get(':clientId')
  async getShaping(@Param('clientId', ParseUUIDPipe) clientId: string) {
    const shapes =
      await this.shapingService.getAllNotConnectedByClientId(clientId);

    if (shapes.length > 0) {
      return mapShapingToEntity(shapes[0]);
    }

    return null;
  }

  @Patch(':shapingId')
  async finishShaping(
    @Body('clientId', ParseUUIDPipe) clientId: string,
    @Param('shapingId', ParseUUIDPipe) shapingId: string,
  ) {
    const shaping = await this.shapingService.getOneByIdAndClientIdOrThrow({
      shapingId,
      clientId,
    });

    if (shaping.score < 70) {
      throw new BadRequestException(
        'Shaping score must be at least 70 to finish.',
      );
    }

    const existingProject =
      await this.projectsService.getOneByShapingId(shapingId);

    if (existingProject && existingProject.status !== 'draft') {
      return mapProjectToEntity(existingProject, this.logoPath);
    }

    const project =
      existingProject ||
      (await this.projectsService.createDraft({
        shapingId: shaping.id,
        userId: null,
        clientId,
      }));

    const updatedProject = await this.shapingService.startProjectShaping({
      project,
      shaping,
    });

    return mapProjectToEntity(updatedProject, this.logoPath);
  }

  @Post(':shapingId/summary')
  async summarizeShaping(
    @Body('clientId', ParseUUIDPipe) clientId: string,
    @Param('shapingId', ParseUUIDPipe) shapingId: string,
  ) {
    const shaping = await this.shapingService.getOneByIdAndClientIdOrThrow({
      shapingId,
      clientId,
    });

    if (shaping.score < 70) {
      throw new BadRequestException(
        'Shaping score must be at least 70 to summarize.',
      );
    }

    const messagesCount = shaping.messages.length;
    if (shaping.summaries.length > 0) {
      const lastSummary = shaping.summaries[shaping.summaries.length - 1];
      if (lastSummary.onMessagesCount >= messagesCount) {
        console.log(lastSummary.onMessagesCount, messagesCount);
        return mapShapingToEntity(shaping);
      }
    }

    const { summary, improvements } =
      await this.shapingAiService.summarizeShaping(shaping);

    const newSummary: ShapingSummary = {
      content: summary,
      improvements,
      onMessagesCount: messagesCount,
      createdAt: new Date(),
    };

    const summaries = [...shaping.summaries, newSummary];
    await this.shapingService.updatePartial(shaping.id, { summaries });

    return mapShapingToEntity({ ...shaping, summaries });
  }

  @Post(':shapingId')
  async addUserMessage(
    @Body('message') message: string,
    @Body('clientId', ParseUUIDPipe) clientId: string,
    @Param('shapingId', ParseUUIDPipe) shapingId: string,
  ) {
    const shaping = await this.shapingService.getOneByIdAndClientIdOrThrow({
      shapingId,
      clientId,
    });

    const shapingWithMessage = await this.shapingService.addUserMessage({
      message,
      shaping,
    });

    const { followUpQuestion, followUpAnswers, score, assistantComment } =
      await this.shapingAiService.processShapingData(
        shapingWithMessage,
        'claude-sonnet-4-6',
      );

    const updatedShaping = await this.shapingService.addAssistantMessage({
      shaping: shapingWithMessage,
      message: followUpQuestion,
      comment: assistantComment,
      score,
      followUpAnswers,
    });

    return mapShapingToEntity(updatedShaping);
  }
}
