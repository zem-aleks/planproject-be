import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Observable } from 'rxjs';
import { ChatChunkStreamResponse } from '../types/stream';
import { AiChatMessage } from '../types/message';
import OpenAI from 'openai';
import { TranscriptionSession } from 'openai/src/resources/beta/realtime/transcription-sessions';
import {
  AUDIO_CONFIGURATION,
  AudioEnvironment,
} from '../../config/audioConfiguration';

export const MODELS = [
  { name: 'gpt-4o', contextWindow: 128000, title: 'GPT-4o' },
  { name: 'gpt-4-turbo', contextWindow: 128000, title: 'GPT-4-Turbo' },
  { name: 'gpt-3.5-turbo', contextWindow: 16385, title: 'GPT-3.5-Turbo' },
] as const;

export type ModelType = (typeof MODELS)[number]['name'];

@Injectable()
export class OpenaiService {
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const openaiKey = configService.get<string>('OPENAI_API_KEY');
    const openaiOrgId = configService.get<string>('OPENAI_ORG_ID');
    if (!openaiKey) {
      throw new Error('No API KEY');
    }

    this.openai = new OpenAI({
      apiKey: openaiKey,
      organization: openaiOrgId,
    });
  }

  async getTranscriptionSession({
    audioEnvironment,
    prompt,
    model,
  }: {
    audioEnvironment: AudioEnvironment;
    prompt?: string;
    model?:
      | 'gpt-4o-transcribe'
      | 'gpt-4o-mini-transcribe'
      | 'whisper-1'
      | undefined;
  }): Promise<TranscriptionSession> {
    return this.openai.beta.realtime.transcriptionSessions.create({
      input_audio_format: 'pcm16',
      input_audio_transcription: { model, prompt, language: 'en' },
      include: ['item.input_audio_transcription.logprobs'],
      ...AUDIO_CONFIGURATION[audioEnvironment || 'robot'],
    });
  }

  async completeChat({
    modelType,
    temperature,
    messages,
  }: {
    modelType: ModelType;
    temperature: number;
    messages: AiChatMessage[];
  }) {
    const parser = new StringOutputParser();
    const model = new ChatOpenAI({ model: modelType, temperature });
    const chain = model.pipe(parser);
    return await chain.invoke(messages);
  }

  async completeChatStream({
    modelType,
    temperature,
    messages,
  }: {
    modelType: ModelType;
    temperature: number;
    messages: AiChatMessage[];
  }): Promise<Observable<ChatChunkStreamResponse>> {
    const parser = new StringOutputParser();
    const model = new ChatOpenAI({ model: modelType, temperature });
    const chain = model.pipe(parser);
    const stream = await chain.stream(messages);

    return new Observable<ChatChunkStreamResponse>((observer) => {
      const onTimeout = () => {
        observer.error('Timeout');
      };
      let timer = setTimeout(onTimeout, 1000 * 30);

      (async () => {
        try {
          for await (const chunk of stream as AsyncIterable<string>) {
            clearTimeout(timer);
            timer = setTimeout(onTimeout, 1000 * 30);
            observer.next({
              type: 'chunk',
              content: chunk,
            });
          }
          clearTimeout(timer);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }
}
