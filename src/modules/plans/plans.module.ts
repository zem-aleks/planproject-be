import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';
import { Project } from './projects/entities/project.entity';
import { ProjectsController } from './projects/controllers/projects.controller';
import { ProjectsService } from './projects/services/projects.service';
import { ProjectsAiService } from './projects/services/projects-ai.service';
import { Phase } from './phases/entities/phase.entity';
import { PhasesController } from './phases/controllers/phases.controller';
import { PhasesService } from './phases/services/phases.service';
import { PhasesAiService } from './phases/services/phases-ai.service';
import { Milestone } from './milestones/entities/milestone.entity';
import { Task } from './tasks/entities/task.entity';
import { MilestonesController } from './milestones/controllers/milestones.controller';
import { MilestonesService } from './milestones/services/milestones.service';
import { MilestonesAiService } from './milestones/services/milestones-ai.service';
import { TasksController } from './tasks/controllers/tasks.controller';
import { TasksService } from './tasks/services/tasks.service';
import { TasksAiService } from './tasks/services/tasks-ai.service';
import { PlansService } from './services/plans.service';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Phase, Milestone, Task]),
    UsersModule,
    SupabaseModule,
    forwardRef(() => TimelineModule),
  ],
  controllers: [
    ProjectsController,
    PhasesController,
    MilestonesController,
    TasksController,
  ],
  providers: [
    ProjectsService,
    ProjectsAiService,
    PhasesService,
    PhasesAiService,
    MilestonesService,
    MilestonesAiService,
    TasksService,
    TasksAiService,
    PlansService,
  ],
  exports: [
    ProjectsService,
    PhasesService,
    TasksService,
    ProjectsAiService,
    MilestonesService,
    PlansService,
  ],
})
export class PlansModule {}
