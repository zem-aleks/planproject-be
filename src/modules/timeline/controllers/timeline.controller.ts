import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { ProjectByIdPipe } from '../../plans/projects/pipes/project-by-id.pipe';
import { Project } from '../../plans/projects/entities/project.entity';
import { TimelineService } from '../services/timeline.service';
import { mapTimelinePointToEntity } from '../mappers/mapTimelinePointToEntity';
import { MilestonesService } from '../../plans/milestones/services/milestones.service';
import { PlansService } from '../../plans/services/plans.service';
import { getProjectDay } from '../../plans/projects/helpers/getProjectDay';
import { TimelineEventsService } from '../services/timeline-events.service';
import { notReachable } from '../../../shared/utils/notReachable';
import { isTimelineEventMilestone } from '../types/entity';
import { mapMilestoneToEntity } from '../../plans/milestones/mappers/mapMilestoneToEntity';
import { TimelineAiService } from '../services/timeline-ai.service';
import { CustomRequest } from '../../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../../users/pipes/user.pipe';
import { User } from '../../users/entities/user.entity';

@Controller('timeline')
@UseGuards(JwtAuthGuard)
export class TimelineController {
  constructor(
    private readonly timelineService: TimelineService,
    private readonly timelineAiService: TimelineAiService,
    private readonly timelineEventsService: TimelineEventsService,
    private readonly plansService: PlansService,
    private readonly milestonesService: MilestonesService,
  ) {}

  @Post(':projectId/extend-today') async extendToday(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    if (project.status === 'completed') {
      throw new BadRequestException({
        message: 'Project is already completed',
        code: 'PROJECT_COMPLETED',
      });
    }

    const activeMilestone = await this.milestonesService.getActiveMilestone(
      project.id,
    );

    if (activeMilestone) {
      throw new BadRequestException({
        message: 'There is already an active milestone for this project.',
        code: 'MILESTONE_ACTIVE',
      });
    }

    const status = await this.plansService.activateNextMilestone(project);
    switch (status.type) {
      case 'noMilestonesToStart':
        throw new BadRequestException({
          message: 'Project is already completed',
          code: 'PROJECT_COMPLETED',
        });

      case 'success':
        const activeMilestone =
          await this.milestonesService.getOneByIdWithPhase(status.milestone.id);

        return mapMilestoneToEntity({
          ...status.milestone,
          ...activeMilestone,
        });

      default:
        return notReachable(status);
    }
  }
  @Get(':projectId/comment')
  async getFocusComment(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @CustomRequest(UserPipe) user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    if (user.subscription !== 'business') {
      throw new UnauthorizedException('Permissions denied');
    }

    if (project.status !== 'active') {
      throw new BadRequestException({
        message: 'Project is not active',
        code: 'PROJECT_NOT_ACTIVE',
      });
    }

    const projectDay = getProjectDay(project);
    const timelinePoint = await this.timelineService.getTimelinePointOrCreate({
      projectId: project.id,
      projectDay,
    });

    return this.timelineAiService.generateTimelinePointContent({
      project,
      timelinePoint,
      events: await this.timelineEventsService.hydrateEvents(
        timelinePoint.events,
      ),
    });
  }

  @Get(':projectId/today')
  async getToday(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    if (project.status !== 'active') {
      throw new BadRequestException({
        message: 'Project is not active',
        code: 'PROJECT_NOT_ACTIVE',
      });
    }

    // if (project.status === 'completed') {
    //   throw new BadRequestException({
    //     message: 'Project is already completed',
    //     code: 'PROJECT_COMPLETED',
    //   });
    // }

    const projectDay = getProjectDay(project);
    const timelinePoint = await this.timelineService.getTimelinePointOrCreate({
      projectId: project.id,
      projectDay,
    });
    const todayMilestoneEvents = timelinePoint.events.filter(
      isTimelineEventMilestone,
    );

    const activeMilestone = await this.milestonesService.getActiveMilestone(
      project.id,
    );

    console.log(activeMilestone, todayMilestoneEvents.length);

    if (activeMilestone) {
      const todayContainActiveMilestone =
        todayMilestoneEvents.filter((e) => e.milestoneId === activeMilestone.id)
          .length > 0;

      if (!todayContainActiveMilestone) {
        await this.timelineEventsService.registerEvents({
          projectDay,
          projectId: project.id,
          events: [
            {
              type: 'milestone.continue',
              milestoneId: activeMilestone.id,
              comment: '',
              createdAt: new Date(),
            },
          ],
        });
      }

      return mapMilestoneToEntity(activeMilestone);
    }

    if (todayMilestoneEvents.length > 0) {
      return null;
    }

    const status = await this.plansService.activateNextMilestone(project);
    switch (status.type) {
      case 'noMilestonesToStart':
        // throw new BadRequestException({
        //   message: 'Project is already completed',
        //   code: 'PROJECT_COMPLETED',
        // });
        return null;

      case 'success':
        const activeMilestone =
          await this.milestonesService.getOneByIdWithPhase(status.milestone.id);

        return mapMilestoneToEntity({
          ...status.milestone,
          ...activeMilestone,
        });

      default:
        return notReachable(status);
    }
  }

  @Get(':projectId/history')
  async getHistory(
    @Param('projectId', ProjectByIdPipe) project: Project,
    @AuthUser() user: User,
  ) {
    if (project.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }

    const timelinePoints = await this.timelineService.getProjectHistory(
      project.id,
    );

    const promises = timelinePoints.map(async (timelinePoint) => {
      const pointEvents = await this.timelineEventsService.hydrateEvents(
        timelinePoint.events,
      );
      return mapTimelinePointToEntity(timelinePoint, pointEvents);
    });

    return Promise.all(promises);
  }
}
