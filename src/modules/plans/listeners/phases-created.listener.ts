import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Project } from '../projects/entities/project.entity';
import { Phase } from '../phases/entities/phase.entity';
import { MilestonesAiService } from '../milestones/services/milestones-ai.service';
import { MilestonesService } from '../milestones/services/milestones.service';
import { PhasesService } from '../phases/services/phases.service';

@Injectable()
export class PhasesCreatedListener {
  constructor(
    private readonly milestonesAiService: MilestonesAiService,
    private readonly milestonesService: MilestonesService,
    private readonly phasesService: PhasesService,
  ) {}

  @OnEvent('phase.createdForProject')
  async generatePhasesMilestones({
    project,
    phases,
  }: {
    project: Project;
    phases: Phase[];
  }) {
    if (phases.length < 1) {
      return;
    }

    try {
      const { milestones } =
        await this.milestonesAiService.generateProjectMilestones({
          project,
          phases,
        });

      await this.milestonesService.deleteForProject(project.id);
      await this.milestonesService.createMany(
        milestones.map((milestone) => ({
          ...milestone,
          projectId: project.id,
          userId: project.userId as string,
          status: 'notStarted',
          startedAt: new Date(),
          completeMessage: null,
          completedAt: null,
        })),
      );
      await this.phasesService.updateByProjectPartial(project.id, {
        status: 'notStarted',
      });
    } catch (e) {
      console.error(e);
      await this.phasesService.updateByProjectPartial(project.id, {
        status: 'error',
      });
    }
  }

  @OnEvent('phase.updatedForProject')
  async updateMilestonesForPhases({
    project,
    phases,
  }: {
    project: Project;
    phases: Phase[];
  }) {
    if (phases.length < 1) {
      return;
    }

    const buildingPhases = phases.filter((p) => p.status === 'building');
    if (buildingPhases.length === 0) {
      return;
    }

    try {
      const { milestones } =
        await this.milestonesAiService.generateProjectAdditionalMilestones({
          project,
          phases,
        });

      await this.milestonesService.createMany(
        milestones.map((milestone) => ({
          ...milestone,
          projectId: project.id,
          userId: project.userId as string,
          status: 'notStarted',
          startedAt: new Date(),
          completeMessage: null,
          completedAt: null,
        })),
      );
      await this.phasesService.updateManyPartial(
        buildingPhases.map((p) => p.id),
        {
          status: 'notStarted',
        },
      );
    } catch (e) {
      console.error(e);
      await this.phasesService.updateByProjectPartial(project.id, {
        status: 'error',
      });
    }
  }
}
