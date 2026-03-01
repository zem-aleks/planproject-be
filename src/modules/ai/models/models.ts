import { ChatGroq } from '@langchain/groq';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { notReachable } from '../../../shared/utils/notReachable';
import { ChatAnthropic } from '@langchain/anthropic';
import { undefined } from 'zod';

export type ModelEntity =
  | ChatOpenAI
  | ChatGoogleGenerativeAI
  | ChatGroq
  | ChatAnthropic;

export type ModelType =
  | 'maverick'
  | 'gpt-4o-mini'
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  | 'gpt-5-nano'
  | 'gpt-5-mini'
  | 'gemini-2.0-flash'
  | 'gemini-2.5-flash'
  | 'qwen'
  | 'deepseek'
  | 'claude-opus-4-6'
  | 'claude-sonnet-4-6';

export const getModel = (model: ModelType, temperature: number) => {
  switch (model) {
    case 'claude-opus-4-6':
      return new ChatAnthropic({
        model: 'claude-opus-4-6',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        topP: undefined,
        temperature,
      });

    case 'claude-sonnet-4-6':
      return new ChatAnthropic({
        model: 'claude-sonnet-4-6',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        topP: undefined,
        temperature,
      });

    case 'deepseek':
      return new ChatGroq({
        model: 'deepseek-r1-distill-llama-70b',
        temperature,
      });

    case 'qwen':
      return new ChatGroq({
        model: 'qwen-qwq-32b',
        temperature,
      });

    case 'maverick':
      return new ChatGroq({
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        temperature,
      });

    case 'gpt-5-nano':
    case 'gpt-5-mini':
    case 'gpt-4.1':
    case 'gpt-4.1-mini':
    case 'gpt-4.1-nano':
    case 'gpt-4o-mini':
      return new ChatOpenAI({
        model,
        temperature,
      });

    case 'gemini-2.0-flash':
    case 'gemini-2.5-flash':
      return new ChatGoogleGenerativeAI({
        model,
        temperature,
      });

    default:
      return notReachable(model);
  }
};
