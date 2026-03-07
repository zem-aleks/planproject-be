import { Phase } from '../entities/phase.entity';

interface RenderPhasesOptions {
  includeStatus?: boolean;
}

export const renderPhases = (
  phases: Phase[],
  options: RenderPhasesOptions = {},
): string => {
  return phases
    .map((p) => {
      const lines = [
        `### ${p.title} (id: ${p.id})`,
        p.description || 'No description',
        '',
        `- Days needed: ${p.minDaysNeeded}–${p.maxDaysNeeded}`,
        `- Expertise: ${p.expertiseNeeded}`,
        `- Timeline: day ${p.timelineStartDay} → day ${p.timelineEndDay}`,
      ];
      if (options.includeStatus) {
        lines.push(`- Status: ${p.status}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
};
