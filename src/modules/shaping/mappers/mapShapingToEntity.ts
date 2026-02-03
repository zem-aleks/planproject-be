import { Shaping } from '../entities/shaping.entity';
import { ShapingEntity } from '../types/entity';

export const mapShapingToEntity = (shaping: Shaping): ShapingEntity => {
  const messagesCount = shaping.messages.length;
  if (shaping.summaries.length > 0) {
    const lastSummary = shaping.summaries[shaping.summaries.length - 1];
    if (lastSummary.onMessagesCount >= messagesCount) {
      return {
        id: shaping.id,
        projectId: shaping.projectId,
        messages: shaping.messages,
        score: shaping.score,
        status: shaping.status,
        summary: lastSummary.content,
        improvements: lastSummary.improvements,
      };
    }
  }

  return {
    id: shaping.id,
    projectId: shaping.projectId,
    messages: shaping.messages,
    score: shaping.score,
    status: shaping.status,
    summary: null,
    improvements: null,
  };
};
