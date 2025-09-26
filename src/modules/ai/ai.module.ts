import { Module } from '@nestjs/common';
import { OpenaiService } from './services/openai.service';
import { HttpModule } from '@nestjs/axios';
import { TokensService } from './services/tokens.service';
import { AiController } from './ai.controller';

@Module({
  imports: [HttpModule],
  providers: [OpenaiService, TokensService],
  exports: [OpenaiService, TokensService],
  controllers: [AiController],
})
export class AiModule {}
