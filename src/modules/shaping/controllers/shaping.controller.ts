import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ShapingService } from '../services/shaping.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';
import { mapShapingToEntity } from '../mappers/mapShapingToEntity';
import { ShapingAiService } from '../services/shaping-ai.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { PhasesService } from '../../projects/services/phases.service';

@Controller('shaping')
@UseGuards(JwtAuthGuard)
export class ShapingController {
  constructor(
    private readonly shapingService: ShapingService,
    private readonly shapingAiService: ShapingAiService,
    private readonly projectsService: ProjectsService,
    private readonly phasesService: PhasesService,
  ) {}

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

    const { followUpQuestion, score } =
      await this.shapingAiService.processShapingData(shapingWithMessage);

    const updatedShaping = await this.shapingService.addAssistantMessage({
      shaping: shapingWithMessage,
      message: followUpQuestion,
      score,
    });

    return mapShapingToEntity(updatedShaping);
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

    const project = await this.projectsService.getOneById(shaping.projectId);
    if (!project) {
      throw new BadRequestException('Project not found.');
    }

    const details = await this.shapingAiService.summarizeProjectDetails(
      shaping,
      project,
    );

    const updatedProject = await this.projectsService.update({
      ...project,
      title: details.projectTitle,
      description: details.projectDescription,
      status: 'analyzing',
    });

    const phases = await this.phasesService.createMany(
      details.projectPhases.map((phase) => ({
        projectId: project.id,
        title: phase.phaseTitle,
        description: phase.phaseDescription,
        minDaysNeeded: phase.minDaysNeeded,
        maxDaysNeeded: phase.maxDaysNeeded,
        expertiseNeeded: phase.expertiseNeeded,
        timelineStartDay: phase.timelineStartDay,
        timelineEndDay: phase.timelineEndDay,
        status: 'notStarted',
      })),
    );

    console.log(details, phases, updatedProject);
    return details;
  }

  @Get('/project/:projectId')
  async getShaping(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @AuthUser() user: User,
  ) {
    const shaping = await this.shapingService.getOneByProjectId({
      projectId,
      userId: user.id,
    });

    if (!shaping) {
      const newShaping = await this.shapingService.create({
        projectId,
        userId: user.id,
        score: 0,
        messages: [],
      });

      return mapShapingToEntity(newShaping);
    }

    return mapShapingToEntity(shaping);
  }

  @Delete(':shapingId')
  async deleteShaping(@Param('shapingId', ParseUUIDPipe) shapingId: string) {
    return this.shapingService.softDelete(shapingId);
  }
}
