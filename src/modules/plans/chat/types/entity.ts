import { z } from 'zod';

// --- Chat Context ---

export const CHAT_CONTEXT_TYPES = [
  'general',
  'phase',
  'milestone',
  'task',
  'open_question',
  'workstream',
  'assumption',
  'decision',
] as const;

export type ChatContextType = (typeof CHAT_CONTEXT_TYPES)[number];

export type ChatContext = {
  type: ChatContextType;
  entityId?: string;
  label?: string;
};

// --- Pending Proposals ---

export type ProposalChanges = {
  soul?: string;
  plan?: string;
};

export type PendingProposal = {
  id: string;
  toolCallId: string;
  toolName: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  changes?: ProposalChanges;
};

export type ProposalEntity = {
  id: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
};

// --- Messages ---

export type ChatUserMessage = {
  id: string;
  role: 'user';
  content: string;
  createdAt: Date;
};

export type ChatAssistantMessage = {
  id: string;
  role: 'assistant';
  content: string;
  proposals: ProposalEntity[];
  createdAt: Date;
};

export type ChatMessageEntity = ChatUserMessage | ChatAssistantMessage;

// --- Schemas ---

export const SEND_CHAT_MESSAGE_SCHEMA = z.object({
  message: z.string().trim().min(1),
});

export type SendChatMessageData = z.infer<typeof SEND_CHAT_MESSAGE_SCHEMA>;

export const CREATE_CHAT_SCHEMA = z.object({
  context: z
    .object({
      type: z.enum(CHAT_CONTEXT_TYPES),
      entityId: z.string().trim().optional(),
      label: z.string().trim().optional(),
    })
    .optional(),
});

export type CreateChatData = z.infer<typeof CREATE_CHAT_SCHEMA>;

export const PROPOSAL_ACTION_SCHEMA = z.object({});

export type ProposalActionData = z.infer<typeof PROPOSAL_ACTION_SCHEMA>;

// --- Stream Events ---

export type ChatStreamChunk = { type: 'chunk'; content: string };
export type ChatStreamConfirm = {
  type: 'confirm';
  proposalId: string;
  description: string;
};
export type ChatStreamDone = {
  type: 'done';
  messageId: string | null;
  chatName?: string;
};
export type ChatStreamError = { type: 'error'; messageId: string | null };
export type ChatStreamToolCall = { type: 'tool_call'; name: string };
export type ChatStreamProposalProgress = {
  type: 'proposal_progress';
  stage: 'analyzing' | 'generating_changes';
};
export type ChatStreamEvent =
  | ChatStreamChunk
  | ChatStreamConfirm
  | ChatStreamToolCall
  | ChatStreamProposalProgress
  | ChatStreamDone
  | ChatStreamError;

// --- Response Entity ---

export type ChatEntity = {
  id: string;
  projectId: string;
  name: string | null;
  context: ChatContext | null;
  messages: ChatMessageEntity[];
  createdAt: Date;
  updatedAt: Date;
};
