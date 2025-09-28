import { ShapeMessage } from '../../shaping/types/entity';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { notReachable } from '../../../shared/utils/notReachable';

export const getLangchainMessages = (
  messages: ShapeMessage[],
): Array<AIMessage | HumanMessage> => {
  return messages.map((m) => {
    switch (m.role) {
      case 'user':
        return new HumanMessage(m.content);

      case 'assistant':
        return new AIMessage(m.content);

      default:
        return notReachable(m);
    }
  });
};
