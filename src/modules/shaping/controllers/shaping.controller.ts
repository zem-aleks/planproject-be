import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ShapingService } from '../services/shaping.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';
import { ShapingAiService } from '../services/shaping-ai.service';
import { ProjectsService } from '../../plans/projects/services/projects.service';
import { PhasesService } from '../../plans/phases/services/phases.service';
import { SupabaseStorageService } from '../../supabase/supabase-storage.service';
import { mapProjectToEntity } from '../../plans/projects/mappers/mapProjectToEntity';
import { ProjectByIdPipe } from '../../plans/projects/pipes/project-by-id.pipe';
import { Project } from '../../plans/projects/entities/project.entity';
import { CustomRequest } from '../../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../../users/pipes/user.pipe';
import { mapShapingToEntity } from '../mappers/mapShapingToEntity';
import * as dayjs from 'dayjs';

@Controller('shaping')
@UseGuards(JwtAuthGuard)
export class ShapingController {
  readonly logoPath: string;

  constructor(
    private readonly shapingService: ShapingService,
    private readonly shapingAiService: ShapingAiService,
    private readonly projectsService: ProjectsService,
    private readonly phasesService: PhasesService,
    private readonly storageService: SupabaseStorageService,
  ) {
    this.logoPath = this.storageService.getBucketUrl('logo') + '/';
  }

  @Post()
  async createShaping(
    @Body('message') message: string,
    @Body('clientId', ParseUUIDPipe) clientId: string,
    @AuthUser() user: User,
  ) {
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message is required');
    }

    // TODO: verify if new shaping can be created

    const projectName = `New project (${dayjs().format('YYYY-MM-DD HH:mm')})`;
    const shaping = await this.shapingService.create({
      projectId: null,
      userId: user.id,
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

    const project = await this.projectsService.create({
      title: projectName,
      clientId,
      shapingId: shaping.id,
      userId: user.id,
      status: 'draft',
      description: null,
      summary: null,
      logoUrl: null,
      daysNeeded: null,
    });

    const updatedShaping = await this.shapingService.update({
      ...shaping,
      projectId: project.id,
    });

    const { followUpQuestion, followUpAnswers, assistantComment, score } =
      await this.shapingAiService.processShapingData(
        updatedShaping,
        'gpt-4o-mini',
      );

    const shapingWithMessage = await this.shapingService.addAssistantMessage({
      shaping: updatedShaping,
      message: followUpQuestion,
      comment: assistantComment,
      score,
      followUpAnswers,
    });

    return mapShapingToEntity(shapingWithMessage);
  }

  @Post(':shapingId')
  async addUserMessage(
    @Body() { message }: { message: string },
    @Param('shapingId', ParseUUIDPipe) shapingId: string,
    @AuthUser() user: User,
  ) {
    const shaping = await this.shapingService.getOneByIdOrThrow({
      shapingId,
      userId: user.id,
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

  @Put(':projectId/connect')
  async connectProject(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @CustomRequest(UserPipe) user: User,
  ) {
    const connectedProject = await this.projectsService.update({
      ...project,
      userId: user.id,
    });

    const shaping = await this.shapingService.getOneById(
      connectedProject.shapingId,
    );
    if (!shaping) {
      throw new BadRequestException('Shaping not found for this project.');
    }

    await this.shapingService.update({
      ...shaping,
      projectId: connectedProject.id,
      userId: user.id,
    });
    return mapProjectToEntity(connectedProject, this.logoPath);
  }

  @Post(':shapingId/finish')
  async finishShaping(
    @Param('shapingId', ParseUUIDPipe) shapingId: string,
    @AuthUser() user: User,
  ) {
    const shaping = await this.shapingService.getOneByIdOrThrow({
      shapingId,
      userId: user.id,
    });

    if (shaping.score < 70) {
      throw new BadRequestException(
        'Shaping score must be at least 70 to finish.',
      );
    }

    if (!shaping.projectId) {
      throw new BadRequestException(
        'Shaping must be associated with a project to finish.',
      );
    }

    const project = await this.projectsService.getOneById(shaping.projectId);
    if (!project) {
      throw new BadRequestException('Project not found.');
    }

    const projectSummary =
      await this.shapingAiService.summarizeProjectDescription(shaping);

    const updatedProject = await this.projectsService.update({
      ...project,
      title: projectSummary.projectTitle,
      description: projectSummary.projectDescription,
      summary: projectSummary.projectSummary,
      clientId: shaping.clientId,
      shapingId: shaping.id,
      status: 'shaping',
    });

    await this.shapingService.update({
      ...shaping,
      status: 'finished',
    });

    const { projectPhases } =
      await this.shapingAiService.summarizeProjectPhases(updatedProject);

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
      ...updatedProject,
      daysNeeded: endOfTimeline,
      status: 'analyzing',
    });

    return mapProjectToEntity(newProject, this.logoPath);
  }

  @Get('/project/:projectId')
  async getShaping(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException(
        'You do not have access to this project.',
      );
    }

    const shaping = await this.shapingService.getOneByProjectId({
      projectId: project.id,
      userId: user.id,
    });

    if (!shaping) {
      throw new NotFoundException('Shaping not found for this project.');
    }

    // if (!shaping) {
    //   const newShaping = await this.shapingService.create({
    //     projectId,
    //     userId: user.id,
    //     score: 0,
    //     messages: [],
    //   });
    //
    //   return mapShapingToEntity(newShaping);
    // }
    //
    return mapShapingToEntity(shaping);
  }

  @Delete(':shapingId')
  async deleteShaping(@Param('shapingId', ParseUUIDPipe) shapingId: string) {
    // TODO: verify owner
    return this.shapingService.softDelete(shapingId);
  }
}
