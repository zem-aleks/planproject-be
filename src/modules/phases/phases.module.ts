import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhasesService } from './services/phases.service';
import { Phase } from './entities/phase.entity';
import { PhasesController } from './controllers/phases.controller';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { PhasesAiService } from './services/phases-ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Phase]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [PhasesController],
  providers: [PhasesService, PhasesAiService],
  exports: [PhasesService],
})
export class PhasesModule {}
