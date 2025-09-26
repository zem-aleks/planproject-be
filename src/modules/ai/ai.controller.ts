import { Controller } from '@nestjs/common';
import { OpenaiService } from './services/openai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly openaiService: OpenaiService) {}

  // @Get('/session')
  // async getTranscriptionSession(
  //   @Query('audioEnvironment') audioEnvironment: AudioEnvironment,
  // ) {
  //   console.time('getTranscriptionSession');
  //   console.log('Audio Environment:', audioEnvironment);
  //   const session = await this.openaiService.getTranscriptionSession({
  //     audioEnvironment: audioEnvironment,
  //     model: 'gpt-4o-transcribe', // 'gpt-4o-mini-transcribe', // whisper-1,
  //     // TODO: to be checked, since it seems to cause hallucinations
  //     // prompt: `List of terms for transcription: ${ASSISTANTS[0].dictionary['en'].join(', ')}.`,
  //   });
  //   console.timeEnd('getTranscriptionSession');
  //   return session;
  // }
}
