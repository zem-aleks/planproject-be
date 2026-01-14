import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
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
import { PhasesService } from '../../plans/phases/services/phases.service';
import { ProjectByIdPipe } from '../../plans/projects/pipes/project-by-id.pipe';
import { Project } from '../../plans/projects/entities/project.entity';
import { notReachable } from '../../../shared/utils/notReachable';
import { ProjectsAiService } from '../../plans/projects/services/projects-ai.service';

@Controller('start')
export class ShapingPublicController {
  readonly logoPath: string;

  constructor(
    private readonly shapingService: ShapingService,
    private readonly shapingAiService: ShapingAiService,
    private readonly projectsService: ProjectsService,
    private readonly projectsAiService: ProjectsAiService,
    private readonly storageService: SupabaseStorageService,
    private readonly phasesService: PhasesService,
  ) {
    this.logoPath = this.storageService.getBucketUrl('logo') + '/';
  }

  @Patch(':projectId/logo')
  async generateProjectLogo(
    @Param('projectId', ProjectByIdPipe) project: Project,
    // @AuthUser() user: User,
  ) {
    // if (project.userId !== user.id) {
    //   throw new UnauthorizedException('Permissions denied');
    // }

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
    const shapes = await this.shapingService.getAllByClientId(clientId);
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message is required');
    }

    if (shapes.length > 0) {
      throw new ForbiddenException(
        'You already have a started project. Only one project is available without registration.',
      );
    }

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
    const shapes = await this.shapingService.getAllByClientId(clientId);
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

    if (existingProject) {
      return mapProjectToEntity(existingProject, this.logoPath);
    }

    if (shaping.status !== 'started') {
      throw new BadRequestException('Shaping is already in progress...');
    }

    const processingShaping = await this.shapingService.update({
      ...shaping,
      status: 'processing',
    });

    const projectSummary =
      await this.shapingAiService.summarizeProjectDescription(
        processingShaping,
      );

    const project = await this.projectsService.create({
      title: projectSummary.projectTitle,
      description: projectSummary.projectDescription,
      summary: projectSummary.projectSummary,
      clientId: shaping.clientId,
      shapingId: shaping.id,
      status: 'shaping',
      userId: null,
      logoUrl: null,
      daysNeeded: null,
    });

    await this.shapingService.update({
      ...shaping,
      status: 'finished',
    });

    const { projectPhases } =
      await this.shapingAiService.summarizeProjectPhases(project);

    const phases = await this.phasesService.createMany(
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

    const endOfTimeline = Math.max(...phases.map((p) => p.timelineEndDay), 0);
    const newProject = await this.projectsService.update({
      ...project,
      daysNeeded: endOfTimeline,
      status: 'analyzing',
    });

    return mapProjectToEntity(newProject, this.logoPath);
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
        'gpt-4o-mini',
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
