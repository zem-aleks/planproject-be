export type ShapingEntity = {
  id: string;
  clientId: string;
  userId: string | null;
  projectId: string | null;
  messages: ShapeMessage[];
  score: number;
  status: 'started' | 'processing' | 'finished' | 'error';
  createdAt: Date;
  updatedAt: Date;
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
};
