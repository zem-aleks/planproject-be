import { Chat } from '../entities/chat.entity';
import { ChatEntity, ChatMessageEntity, ProposalEntity } from '../types/entity';
import { ChatMessage } from '../entities/chat-message.entity';

const mapMessageToEntity = (message: ChatMessage): ChatMessageEntity => {
  if (message.role === 'user') {
    return {
      id: message.id,
      role: 'user',
      content: message.content,
      createdAt: message.createdAt,
    };
  }

  const proposals: ProposalEntity[] = message.proposals
    ? Object.values(message.proposals).map((p) => ({
        id: p.id,
        description: p.description,
        status: p.status,
      }))
    : [];

  return {
    id: message.id,
    role: 'assistant',
    content: message.content,
    proposals,
    createdAt: message.createdAt,
  };
};

export const mapChatToEntity = (chat: Chat): ChatEntity => ({
  id: chat.id,
  projectId: chat.projectId,
  name: chat.name ?? null,
  context: chat.context ?? null,
  messages: (chat.messages ?? []).map(mapMessageToEntity),
  createdAt: chat.createdAt,
  updatedAt: chat.updatedAt,
});
