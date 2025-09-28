import { Shaping } from '../entities/shaping.entity';
import { ShapingEntity } from '../types/entity';

export const mapShapingToEntity = (shaping: Shaping): ShapingEntity => {
  return {
    ...shaping,
  };
};
