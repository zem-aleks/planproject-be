import { Module } from '@nestjs/common';
import { TimelineService } from './services/timeline.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimelineController } from './controllers/timeline.controller';
import { TimelineAiService } from './services/timeline-ai.service';
import { TimelinePoint } from './entities/timeline-point.entity';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimelinePoint]),
    UsersModule,
    PlansModule,
  ],
  controllers: [TimelineController],
  providers: [TimelineService, TimelineAiService],
  exports: [],
})
export class TimelineModule {}
