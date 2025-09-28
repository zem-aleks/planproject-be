import { Module } from '@nestjs/common';
import { ShapingService } from './services/shaping.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShapingController } from './controllers/shaping.controller';
import { ShapingAiService } from './services/shaping-ai.service';
import { Shaping } from './entities/shaping.entity';
import { ProjectsModule } from '../projects/projects.module';
import { PhasesModule } from '../phases/phases.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shaping]), ProjectsModule, PhasesModule],
  controllers: [ShapingController],
  providers: [ShapingService, ShapingAiService],
  exports: [],
})
export class ShapingModule {}
