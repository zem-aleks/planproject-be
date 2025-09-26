declare module '@nlpjs/nlu' {
  export type NluIntent = {
    locale: string;
    utterance: string;
    domain: string;
    languageGuessed: boolean;
    localeIso2: string;
    language: string;
    explanation: Array<{ token: string; stem: string; weight: number }>;
    classifications: Array<{ intent: string; score: number }>;
    intent: string;
    score: number;
  };

  export class NluManager {
    constructor(options: {
      container: NluContainer;
      locales: string[];
      trainByDomain: boolean;
    });
    train(): Promise<void>;
    process(text: string): Promise<NluIntent>;
    assignDomain: (string, string, string) => void;
    add: (string, string, string) => void;
    toJSON: () => string;
    fromJSON: (json: string) => NluManager;
  }

  export class NluNeural {}
}
