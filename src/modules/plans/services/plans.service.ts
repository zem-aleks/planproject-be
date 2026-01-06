import { Injectable } from '@nestjs/common';
import { PhasesService } from '../phases/services/phases.service';
import { MilestonesService } from '../milestones/services/milestones.service';
import { Project } from '../projects/entities/project.entity';
import { Milestone } from '../milestones/entities/milestone.entity';
import { Phase } from '../phases/entities/phase.entity';

type ActivateNextMilestoneStatus =
  | { type: 'noMilestonesToStart' }
  | { type: 'success'; milestone: Milestone; phase: Phase };

@Injectable()
export class PlansService {
  constructor(
    private readonly phasesService: PhasesService,
    private readonly milestonesService: MilestonesService,
  ) {}

  // finds the next non active milestone around the project and activate it (can also activate new phase)
  async activateNextMilestone(
    project: Project,
  ): Promise<ActivateNextMilestoneStatus> {
    const phases = await this.phasesService.getAllWithMilestones(project.id);
    const activePhases = phases.filter((p) => p.status === 'inProgress');
    const notStartedMilestones = activePhases
      .flatMap((phase) =>
        phase.milestones.sort((a, b) => a.orderIndex - b.orderIndex),
      )
      .filter((milestone) => milestone.status === 'notStarted');

    // we found milestones to activate inside of active phases
    if (notStartedMilestones.length > 0) {
      const activatedMilestone = await this.milestonesService.activate(
        notStartedMilestones[0],
      );
      return {
        type: 'success',
        milestone: activatedMilestone,
        phase: activePhases.find(
          (p) => p.id === activatedMilestone.phaseId,
        ) as Phase,
      };
    }

    const notStartedPhases = phases
      .filter((phase) => phase.status === 'notStarted')
      .filter((phase) => phase.milestones.length > 0);

    if (notStartedPhases.length === 0) {
      return { type: 'noMilestonesToStart' };
    }

    const activatedPhase = await this.phasesService.activate(
      notStartedPhases[0],
    );
    const sortedMilestones = notStartedPhases[0].milestones.sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );
    const activatedMilestone = await this.milestonesService.activate(
      sortedMilestones[0],
    );

    return {
      type: 'success',
      milestone: activatedMilestone,
      phase: activatedPhase,
    };
  }
}
