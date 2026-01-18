import { Module } from '@nestjs/common';
import { AuditoryService } from './services/auditory.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoryController } from './controllers/auditory.controller';
import { AuditoryAiService } from './services/auditory-ai.service';
import { Auditory } from './entities/auditory.entity';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';
import { ProjectAnalyzingStartedListener } from './listeners/project-analyzing-started.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Auditory]), UsersModule, PlansModule],
  controllers: [AuditoryController],
  providers: [
    AuditoryService,
    AuditoryAiService,
    ProjectAnalyzingStartedListener,
  ],
  exports: [],
})
export class AuditoryModule {}
