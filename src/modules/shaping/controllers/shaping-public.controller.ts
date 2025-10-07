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
import { ProjectsService } from '../../projects/services/projects.service';
import { mapProjectToEntity } from '../../projects/mappers/mapProjectToEntity';
import { SupabaseStorageService } from '../../supabase/supabase-storage.service';
import { PhasesService } from '../../phases/services/phases.service';

@Controller('start')
export class ShapingPublicController {
  readonly logoPath: string;

  constructor(
    private readonly shapingService: ShapingService,
    private readonly shapingAiService: ShapingAiService,
    private readonly projectsService: ProjectsService,
    private readonly storageService: SupabaseStorageService,
    private readonly phasesService: PhasesService,
  ) {
    this.logoPath = this.storageService.getBucketUrl('logo') + '/';
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
        'You already have a started project. Only one project is allowed without registration.',
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

    const { followUpQuestion, assistantComment, score } =
      await this.shapingAiService.processShapingData(shaping, 'gpt-4o-mini');

    const updatedShaping = await this.shapingService.addAssistantMessage({
      shaping,
      message: followUpQuestion,
      comment: assistantComment,
      score,
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

    const { followUpQuestion, score, assistantComment } =
      await this.shapingAiService.processShapingData(
        shapingWithMessage,
        'gpt-4o-mini',
      );

    const updatedShaping = await this.shapingService.addAssistantMessage({
      shaping: shapingWithMessage,
      message: followUpQuestion,
      comment: assistantComment,
      score,
    });

    return mapShapingToEntity(updatedShaping);
  }
}
