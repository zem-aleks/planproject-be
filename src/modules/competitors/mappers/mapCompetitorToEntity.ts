import { Competitor } from '../entities/competitor.entity';
import { CompetitorEntity } from '../types/entity';

export const mapCompetitorToEntity = (item: Competitor): CompetitorEntity => {
  return {
    ...item,
  };
};
