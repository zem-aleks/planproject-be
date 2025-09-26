import { Buffer } from 'buffer';

export type ChunkInfo = {
  start: number;
  end: number | null;
  withVoice: 'yes' | 'no' | 'unknown';
};

export type ChunksIndexParams = {
  startChunkIndex: number;
  endChunkIndex: number;
};

export type TranscriptionStateLoaded = {
  type: 'loaded';
  transcript: string;
} & ChunksIndexParams;

export type TranscriptionStateError = {
  type: 'error';
  error: string;
} & ChunksIndexParams;

export type TranscriptionState =
  | ({ type: 'loading' } & ChunksIndexParams)
  | TranscriptionStateLoaded
  | TranscriptionStateError;

export type RecordingState = {
  type: 'recording';
  // deepgram: DeepgramLiveEntity;
  data: Buffer[];
  // interruptionIndexes: number[];
  chunksInfo: ChunkInfo[];
  // chunksProcessingLength: number;
  // transcriptionsData: LiveTranscriptionResponse[];
  transcriptions: TranscriptionState[];
};

export type FinishingState = Omit<RecordingState, 'type'> & {
  type: 'finishing';
};

export type SttState = RecordingState | FinishingState;
