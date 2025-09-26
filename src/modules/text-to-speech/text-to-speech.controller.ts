import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Query,
  StreamableFile,
} from '@nestjs/common';

import { TextToSpeechService } from './text-to-speech.service';

@Controller('tts')
export class TextToSpeechController {
  constructor(
    private readonly textToSpeechService: TextToSpeechService,
    // private readonly openaiService: OpenaiService,
  ) {}

  @Get()
  @Header('Content-Type', 'audio/aac')
  async convertTextIntoSpeech(
    @Query('text') text: string,
    @Query('voiceId') voiceId: string,
    @Query('modelId') modelId?: string,
    @Query('optimizationLevel') optimizationLevel?: '0' | '1' | '2' | '3' | '4',
    // @Query('speed') speed = 1,
    @Query('language') language: string | undefined = undefined,
  ) {
    // const plainText = removeMd(text, {
    //   stripListLeaders: true, // strip list leaders (default: true)
    //   listUnicodeChar: '', // char to insert instead of stripped list leaders (default: '')
    //   gfm: true, // support GitHub-Flavored Markdown (default: true)
    //   useImgAltText: true, // replace images with alt-text, if present (default: true)
    // });
    // const detectedLanguage = language || (await detectLanguage(plainText));
    // const improvedText = improveText(plainText);
    // if (isOpenaiVoice(voiceId)) {
    //   return this.convertTextIntoSpeechWithOpenai(improvedText, voiceId, speed);
    // }
    //
    // if (isDeepgramVoice(voiceId)) {
    //   return this.convertTextIntoSpeechWithDeepgram(improvedText, voiceId);
    // }

    try {
      const response = await this.textToSpeechService.getAudio(
        text,
        voiceId,
        modelId,
        optimizationLevel,
        language || null,
      );

      return new StreamableFile(response.data);
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Audio is not streamed');
    }
  }
}
