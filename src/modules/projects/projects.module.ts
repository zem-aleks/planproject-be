import { Module } from '@nestjs/common';
import { ProjectsService } from './services/projects.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsController } from './controllers/projects.controller';
import { PhasesService } from './services/phases.service';
import { Phase } from './entities/phase.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    TypeOrmModule.forFeature([Phase]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, PhasesService],
  exports: [ProjectsService, PhasesService],
})
export class ProjectsModule {}
