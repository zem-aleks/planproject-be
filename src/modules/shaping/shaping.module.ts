import { Module } from '@nestjs/common';
import { ShapingService } from './services/shaping.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShapingController } from './controllers/shaping.controller';
import { ShapingAiService } from './services/shaping-ai.service';
import { Shaping } from './entities/shaping.entity';
import { ShapingPublicController } from './controllers/shaping-public.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shaping]),
    SupabaseModule,
    UsersModule,
    PlansModule,
  ],
  controllers: [ShapingController, ShapingPublicController],
  providers: [ShapingService, ShapingAiService],
  exports: [],
})
export class ShapingModule {}
