import { Injectable } from '@nestjs/common';
import { getEncoding, Tiktoken } from 'js-tiktoken';

@Injectable()
export class TokensService {
  readonly encoder: Tiktoken;

  constructor() {
    this.encoder = getEncoding('cl100k_base');
  }

  getTokens(text: string) {
    return this.encoder.encode(text);
  }

  getTokensCount(text: string) {
    return this.getTokens(text).length;
  }
}
