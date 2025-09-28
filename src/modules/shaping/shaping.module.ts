import { Module } from '@nestjs/common';
import { ShapingService } from './services/shaping.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShapingController } from './controllers/shaping.controller';
import { ShapingAiService } from './services/shaping-ai.service';
import { Shaping } from './entities/shaping.entity';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shaping]), ProjectsModule],
  controllers: [ShapingController],
  providers: [ShapingService, ShapingAiService],
  exports: [],
})
export class ShapingModule {}
