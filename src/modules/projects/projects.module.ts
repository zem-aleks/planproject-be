import { forwardRef, Module } from '@nestjs/common';
import { ProjectsService } from './services/projects.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectsAiService } from './services/projects-ai.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';
import { PhasesModule } from '../phases/phases.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    forwardRef(() => UsersModule),
    forwardRef(() => PhasesModule),
    SupabaseModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsAiService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
