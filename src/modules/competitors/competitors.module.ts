import { Module } from '@nestjs/common';
import { CompetitorsService } from './services/competitors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitorsController } from './controllers/competitors.controller';
import { CompetitorsAiService } from './services/competitors-ai.service';
import { Competitor } from './entities/competitor.entity';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';
import { ProjectAnalyzingStartedListener } from './listeners/project-analyzing-started.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Competitor]), UsersModule, PlansModule],
  controllers: [CompetitorsController],
  providers: [
    CompetitorsService,
    CompetitorsAiService,
    ProjectAnalyzingStartedListener,
  ],
  exports: [],
})
export class CompetitorsModule {}
