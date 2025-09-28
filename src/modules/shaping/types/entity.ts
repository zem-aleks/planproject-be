export type ShapingEntity = {
  id: string;
  userId: string;
  projectId: string;
  messages: ShapeMessage[];
  score: number;
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
};
