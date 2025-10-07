import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ShapingService } from '../services/shaping.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';
import { ShapingAiService } from '../services/shaping-ai.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { PhasesService } from '../../phases/services/phases.service';
import { SupabaseStorageService } from '../../supabase/supabase-storage.service';
import { mapProjectToEntity } from '../../projects/mappers/mapProjectToEntity';
import { ProjectByIdPipe } from '../../projects/pipes/project-by-id.pipe';
import { Project } from '../../projects/entities/project.entity';
import { CustomRequest } from '../../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../../users/pipes/user.pipe';

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
      await this.shapingAiService.processShapingData(
        shapingWithMessage,
        'gpt-4o-mini',
      );

    // const updatedShaping = await this.shapingService.addAssistantMessage({
    //   shaping: shapingWithMessage,
    //   message: followUpQuestion,
    //   score,
    // });
    //
    // return mapShapingToEntity(updatedShaping);
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

  @Get('/project/:projectId')
  async getShaping(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @AuthUser() user: User,
  ) {
    const shaping = await this.shapingService.getOneByProjectId({
      projectId,
      userId: user.id,
    });

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
    // return mapShapingToEntity(shaping);
  }

  @Delete(':shapingId')
  async deleteShaping(@Param('shapingId', ParseUUIDPipe) shapingId: string) {
    // TODO: verify owner
    return this.shapingService.softDelete(shapingId);
  }
}
