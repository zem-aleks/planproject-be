import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelType } from './openai.service';
import { AiChatMessage } from '../types/message';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatOpenAI } from '@langchain/openai';
import { Observable } from 'rxjs';
import { ChatChunkStreamResponse } from '../types/stream';

@Injectable()
export class AiService {
  // private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    // const openaiKey = configService.get<string>('OPENAI_API_KEY');
    // const openaiOrgId = configService.get<string>('OPENAI_ORG_ID');
    // if (!openaiKey) {
    //   throw new Error('No API KEY');
    // }
    //
    // this.openai = new OpenAI({
    //   apiKey: openaiKey,
    //   organization: openaiOrgId,
    // });
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
}
