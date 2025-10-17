import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhasesService } from './services/phases.service';
import { Phase } from './entities/phase.entity';
import { PhasesController } from './controllers/phases.controller';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { PhasesAiService } from './services/phases-ai.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Phase]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => TasksModule),
  ],
  controllers: [PhasesController],
  providers: [PhasesService, PhasesAiService],
  exports: [PhasesService, PhasesAiService],
})
export class PhasesModule {}
