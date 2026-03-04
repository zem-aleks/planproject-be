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
import { ProjectShapingStartedListener } from './listeners/project-shaping-started.listener';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PhasesCreatedListener } from './listeners/phases-created.listener';
import { SoulAiService } from './projects/services/soul-ai.service';
import { SoulQueueService } from './projects/services/soul-queue.service';
import { ShapingModule } from '../shaping/shaping.module';
import { Chat } from './chat/entities/chat.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { ChatController } from './chat/controllers/chat.controller';
import { ChatService } from './chat/services/chat.service';
import { ChatAiService } from './chat/services/chat-ai.service';
import { CompetitorsModule } from '../competitors/competitors.module';
import { AuditoryModule } from '../auditory/auditory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Phase,
      Milestone,
      Task,
      Chat,
      ChatMessage,
    ]),
    UsersModule,
    SupabaseModule,
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => ShapingModule),
    forwardRef(() => CompetitorsModule),
    forwardRef(() => AuditoryModule),
  ],
  controllers: [
    ProjectsController,
    PhasesController,
    MilestonesController,
    TasksController,
    ChatController,
  ],
  providers: [
    ProjectsService,
    ProjectsAiService,
    SoulAiService,
    SoulQueueService,
    PhasesService,
    PhasesAiService,
    MilestonesService,
    MilestonesAiService,
    TasksService,
    TasksAiService,
    PlansService,
    ProjectShapingStartedListener,
    PhasesCreatedListener,
    ChatService,
    ChatAiService,
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
