export type AuditorySegment = {
  title: string;
  description: string;
  motivation: string;
  pain: string;
};

export type AuditoryAgeSegment = { ageInterval: string; percentage: number };

export type AuditoryCharacter = {
  title: string;
  description: string;
  usageScenario: string;
};

export type AuditoryEntity = {
  id: string;
  projectId: string;
  ageSeparation: Array<AuditoryAgeSegment>;
  mainSegments: Array<AuditorySegment>;
  characters: Array<AuditoryCharacter>;
  menPercentage: number | null;
  tam: string | null;
  sam: string | null;
  som: string | null;
  auditoryDemands: string | null;
  auditoryPains: string | null;
  differentiation: string | null;
  auditoryChannels: string | null;
};

// menPercentage
// ageSeparation

// tam
// sam
// som

// mainSegments
// characters
// auditoryDemands
// auditoryPains
// differentiation
// auditoryChannels
