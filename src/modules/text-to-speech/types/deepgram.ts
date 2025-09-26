export const DEEPGRAM_VOICES = {
  'aura-asteria-en': {
    name: 'Asteria',
    avatar: '/aura-asteria-en.svg',
    language: 'English',
    accent: 'US',
  },
  'aura-luna-en': {
    name: 'Luna',
    avatar: '/aura-luna-en.svg',
    language: 'English',
    accent: 'US',
  },
  'aura-stella-en': {
    name: 'Stella',
    avatar: '/aura-stella-en.svg',
    language: 'English',
    accent: 'US',
  },
  'aura-athena-en': {
    name: 'Athena',
    avatar: '/aura-athena-en.svg',
    language: 'English',
    accent: 'UK',
  },
  'aura-hera-en': {
    name: 'Hera',
    avatar: '/aura-hera-en.svg',
    language: 'English',
    accent: 'US',
  },
  'aura-orion-en': {
    name: 'Orion',
    avatar: '/aura-orion-en.svg',
    language: 'English',
    accent: 'US',
  },
  'aura-arcas-en': {
    name: 'Arcas',
    avatar: '/aura-arcas-en.svg',
    language: 'English',
    accent: 'US',
  },
  'aura-perseus-en': {
    name: 'Perseus',
    avatar: '/aura-perseus-en.svg',
    language: 'English',
    accent: 'US',
  },
  'aura-angus-en': {
    name: 'Angus',
    avatar: '/aura-angus-en.svg',
    language: 'English',
    accent: 'Ireland',
  },
  'aura-orpheus-en': {
    name: 'Orpheus',
    avatar: '/aura-orpheus-en.svg',
    language: 'English',
    accent: 'US',
  },
  'aura-helios-en': {
    name: 'Helios',
    avatar: '/aura-helios-en.svg',
    language: 'English',
    accent: 'UK',
  },
  'aura-zeus-en': {
    name: 'Zeus',
    avatar: '/aura-zeus-en.svg',
    language: 'English',
    accent: 'US',
  },
} as const;

export type DeepgramVoice = keyof typeof DEEPGRAM_VOICES;

const DEEPGRAM_VOICES_LIST = Object.keys(DEEPGRAM_VOICES) as DeepgramVoice[];

export const isDeepgramVoice = (
  str: string | DeepgramVoice,
): str is DeepgramVoice => {
  return DEEPGRAM_VOICES_LIST.includes(str as DeepgramVoice);
};
