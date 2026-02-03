export type ShapingEntity = {
  id: string;
  projectId: string | null;
  messages: ShapeMessage[];
  summary: string | null;
  improvements: string | null;
  score: number;
  status: 'started' | 'processing' | 'finished' | 'error';
};

export type ShapeMessage = UserMessage | AssistantMessage;

export type UserMessage = {
  id: number;
  role: 'user';
  content: string;
};

export type AssistantMessage = {
  id: number;
  role: 'assistant';
  content: string;
  comment: string;
  answers: string[];
};
