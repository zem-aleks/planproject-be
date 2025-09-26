import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TextToSpeechService {
  private readonly apiKey: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const apiKey = configService.get<string>('ELEVENLABS_API_KEY');
    if (!apiKey) {
      throw new Error('Speech Service setup has errors!');
    }

    this.apiKey = apiKey;
  }

  getAudio(
    text: string,
    voiceId: string,
    modelId = 'eleven_monolingual_v1',
    optimizationLevel: '0' | '1' | '2' | '3' | '4' = '1',
    language: string | null,
  ) {
    return this.httpService.axiosRef.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=${optimizationLevel}&output_format=mp3_44100_64`,
      {
        text: text,
        model_id: modelId,
        language,
        voice_settings: {
          stability: 0.25,
          clarity: 0.5,
          similarity_boost: 0.5,
        },
      },
      {
        responseType: 'stream',
        headers: {
          'xi-api-key': this.apiKey,
        },
      },
    );
  }
}
