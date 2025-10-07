import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhasesService } from './services/phases.service';
import { Phase } from './entities/phase.entity';
import { PhasesController } from './controllers/phases.controller';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Phase]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [PhasesController],
  providers: [PhasesService],
  exports: [PhasesService],
})
export class PhasesModule {}
