import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MulterModule } from '@nestjs/platform-express';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { memoryStorage } from 'multer';
import { AuthModule } from './modules/auth/auth.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { AiModule } from './modules/ai/ai.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { Project } from './modules/projects/entities/project.entity';
import { CryptoModule } from './modules/crypto/crypto.module';
import { ShapingModule } from './modules/shaping/shaping.module';
import { Shaping } from './modules/shaping/entities/shaping.entity';
import { Phase } from './modules/phases/entities/phase.entity';
import { PhasesModule } from './modules/phases/phases.module';
import { MilestonesModule } from './modules/milestones/milestones.module';
import { Milestone } from './modules/milestones/entities/milestone.entity';
import { Task } from './modules/tasks/entities/task.entity';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          schema: 'public',
          url: configService.get('DATABASE_URL'),
          entities: [Project, Shaping, Phase, Milestone, Task],
          synchronize: false,
          migrationsRun: true,
          migrations: ['dist/migration/*{.ts,.js}'],
          logging: false,
          ssl:
            configService.get('ENVIRONMENT') === 'dev'
              ? false
              : { rejectUnauthorized: false },
        };
      },
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fieldSize: 50 * 1024 * 1024 },
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    CryptoModule,
    ScheduleModule.forRoot(),
    SupabaseModule,
    AuthModule,
    AiModule,
    // TextToSpeechModule,
    ProjectsModule,
    ShapingModule,
    PhasesModule,
    MilestonesModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
