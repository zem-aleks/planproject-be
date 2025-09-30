import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MilestonesService } from './services/milestones.service';
import { Milestone } from './entities/milestone.entity';
import { MilestonesController } from './controllers/milestones.controller';
import { PhasesModule } from '../phases/phases.module';
import { ProjectsModule } from '../projects/projects.module';
import { MilestonesAiService } from './services/milestones-ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Milestone]),
    ProjectsModule,
    PhasesModule,
  ],
  controllers: [MilestonesController],
  providers: [MilestonesService, MilestonesAiService],
  exports: [MilestonesService],
})
export class MilestonesModule {}
