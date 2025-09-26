import { Session } from 'openai/resources/beta/realtime/sessions';

export type TranscriptionConfig = {
  input_audio_noise_reduction: Session.InputAudioNoiseReduction;
  turn_detection: Session.TurnDetection;
};

export type AudioEnvironment = 'robot' | 'laptop';

type AudioConfigurationMap = Record<AudioEnvironment, TranscriptionConfig>;

export const AUDIO_CONFIGURATION: AudioConfigurationMap = {
  robot: {
    input_audio_noise_reduction: { type: 'far_field' },
    turn_detection: {
      type: 'server_vad',
      threshold: 0.9,
      silence_duration_ms: 1000,
    },
  },
  laptop: {
    input_audio_noise_reduction: { type: 'near_field' },
    turn_detection: {
      type: 'server_vad',
      threshold: 0.65,
      silence_duration_ms: 1000,
    },
  },
};
