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
import { ShapingAiService } from '../services/shaping-ai.service';
import { ProjectsService } from '../../plans/projects/services/projects.service';
import { SupabaseStorageService } from '../../supabase/supabase-storage.service';
import { mapProjectToEntity } from '../../plans/projects/mappers/mapProjectToEntity';
import { ProjectByIdPipe } from '../../plans/projects/pipes/project-by-id.pipe';
import { Project } from '../../plans/projects/entities/project.entity';
import { CustomRequest } from '../../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../../users/pipes/user.pipe';
import { mapShapingToEntity } from '../mappers/mapShapingToEntity';
import { MembershipService } from '../../subscriptions/services/membership.service';
import { User } from '../../users/entities/user.entity';

@Controller('shaping')
@UseGuards(JwtAuthGuard)
export class ShapingController {
  readonly logoPath: string;

  constructor(
    private readonly shapingService: ShapingService,
    private readonly shapingAiService: ShapingAiService,
    private readonly projectsService: ProjectsService,
    private readonly storageService: SupabaseStorageService,
    private readonly membershipService: MembershipService,
  ) {
    this.logoPath = this.storageService.getBucketUrl('logo') + '/';
  }

  @Post('bind/:shapingId')
  async bindShaping(
    @Body('clientId', ParseUUIDPipe) clientId: string,
    @Param('shapingId', ParseUUIDPipe) shapingId: string,
    @CustomRequest(UserPipe) user: User,
  ) {
    const shape = await this.shapingService.getByIdAndClientId(
      shapingId,
      clientId,
    );

    if (!shape) {
      throw new NotFoundException('Shaping not found.');
    }

    if (!shape.projectId) {
      const project = await this.projectsService.createDraft({
        clientId,
        shapingId: shape.id,
        userId: user.id,
      });

      await this.shapingService.updatePartial(shape.id, {
        projectId: project.id,
        userId: user.id,
      });
      return mapProjectToEntity(project, this.logoPath);
    }

    await this.shapingService.updatePartial(shape.id, {
      userId: user.id,
    });

    const project = await this.projectsService.getOneById(shape.projectId);
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    let activated = project.activated;
    const canBeActivated =
      project.status === 'shaping' || project.status === 'analyzing';

    if (!activated && canBeActivated) {
      activated = await this.membershipService.canActivateNewProject(user);
    }

    await this.projectsService.updatePartial(project.id, {
      userId: user.id,
      activated,
    });
    return mapProjectToEntity(project, this.logoPath);
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

    const project = await this.projectsService.createDraft({
      clientId,
      shapingId: shaping.id,
      userId: user.id,
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
      activated: await this.membershipService.canActivateNewProject(user),
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

    const updatedProject = await this.shapingService.startProjectShaping({
      project,
      shaping,
    });

    return mapProjectToEntity(updatedProject, this.logoPath);
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
