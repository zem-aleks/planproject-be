import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './services/tasks.service';
import { Task } from './entities/task.entity';
import { TasksController } from './controllers/tasks.controller';
import { PhasesModule } from '../phases/phases.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksAiService } from './services/tasks-ai.service';
import { MilestonesModule } from '../milestones/milestones.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => PhasesModule),
    forwardRef(() => MilestonesModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksAiService],
  exports: [TasksService],
})
export class TasksModule {}
