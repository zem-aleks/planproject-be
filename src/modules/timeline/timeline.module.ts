import { forwardRef, Module } from '@nestjs/common';
import { TimelineService } from './services/timeline.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimelineController } from './controllers/timeline.controller';
import { TimelineAiService } from './services/timeline-ai.service';
import { TimelinePoint } from './entities/timeline-point.entity';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';
import { TimelineEventsService } from './services/timeline-events.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { ProjectEventsListener } from './listeners/project-events.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimelinePoint]),
    UsersModule,
    SupabaseModule,
    forwardRef(() => PlansModule),
  ],
  controllers: [TimelineController],
  providers: [
    TimelineService,
    TimelineAiService,
    TimelineEventsService,
    ProjectEventsListener,
  ],
  exports: [TimelineService],
})
export class TimelineModule {}
