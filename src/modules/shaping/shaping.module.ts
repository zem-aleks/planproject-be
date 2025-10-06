import { Module } from '@nestjs/common';
import { ShapingService } from './services/shaping.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShapingController } from './controllers/shaping.controller';
import { ShapingAiService } from './services/shaping-ai.service';
import { Shaping } from './entities/shaping.entity';
import { ProjectsModule } from '../projects/projects.module';
import { PhasesModule } from '../phases/phases.module';
import { ShapingPublicController } from './controllers/shaping-public.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shaping]),
    ProjectsModule,
    PhasesModule,
    SupabaseModule,
  ],
  controllers: [ShapingController, ShapingPublicController],
  providers: [ShapingService, ShapingAiService],
  exports: [],
})
export class ShapingModule {}
