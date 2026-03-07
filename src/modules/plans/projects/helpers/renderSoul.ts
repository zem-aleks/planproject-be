import { ProjectSoul } from '../types/entity';

export const renderSoul = (p: ProjectSoul) => {
  const lines: string[] = [];
  const add = (line: string) => lines.push(line);
  const blank = () => lines.push('');

  add(`# ${p.name}`);
  blank();
  add(p.summary);
  blank();
  add(`**Domain:** ${p.domain}`);
  blank();

  // Current State
  add('## Current State');
  add(p.currentState.description);
  if (p.currentState.keyMetrics?.length) {
    blank();
    p.currentState.keyMetrics.forEach((m) => add(`- ${m}`));
  }
  blank();

  // Desired Outcomes
  add('## Desired Outcomes');
  p.desiredOutcomes.forEach((o) =>
    add(`- ${o.outcome}${o.inferred ? ' [inferred]' : ''}`),
  );
  blank();

  // Target Users
  if (p.targetUsers) {
    add('## Target Users');
    add(p.targetUsers.description);
    blank();
    p.targetUsers.segments.forEach((s) => add(`- ${s}`));
    blank();
  }

  // Workstreams
  add('## Workstreams');
  for (const priority of ['must', 'should', 'nice-to-have'] as const) {
    const items = p.workstreams.filter((w) => w.priority === priority);
    if (items.length === 0) continue;
    const label = {
      must: 'Must Have',
      should: 'Should Have',
      'nice-to-have': 'Nice to Have',
    }[priority];
    add(`### ${label}`);
    items.forEach((w) =>
      add(
        `- **${w.name}** — ${w.description}${w.inferred ? ' [inferred]' : ''}`,
      ),
    );
    blank();
  }

  // Resources & Tools
  if (p.resources.length > 0) {
    add('## Resources & Tools');
    p.resources.forEach((r) =>
      add(
        `- **${r.name}** — ${r.relevance}${r.tentative ? ' [tentative]' : ''}`,
      ),
    );
    blank();
  }

  // Constraints
  if (p.constraints.length > 0) {
    add('## Constraints');
    p.constraints.forEach((c) => add(`- **${c.type}:** ${c.description}`));
    blank();
  }

  // Key Decisions
  if (p.decisions.length > 0) {
    add('## Key Decisions');
    p.decisions.forEach((d) =>
      add(
        `- **${d.topic}:** ${d.chosen}${d.rationale ? ` — ${d.rationale}` : ''}`,
      ),
    );
    blank();
  }

  // Open Questions
  if (p.openQuestions.length > 0) {
    add('## Open Questions');
    const discussed = p.openQuestions.filter(
      (q) => q.status === 'discussed_unresolved',
    );
    const notDiscussed = p.openQuestions.filter(
      (q) => q.status === 'not_discussed',
    );

    if (discussed.length > 0) {
      add('### Discussed but Unresolved');
      discussed.forEach((q) => {
        add(`- **${q.topic}**${q.context ? ` — ${q.context}` : ''}`);
        if (q.suggestedOptions?.length) {
          add(`  Options: ${q.suggestedOptions.join(', ')}`);
        }
      });
      blank();
    }
    if (notDiscussed.length > 0) {
      add('### Not Yet Discussed');
      notDiscussed.forEach((q) => {
        add(`- **${q.topic}**${q.context ? ` — ${q.context}` : ''}`);
        if (q.suggestedOptions?.length) {
          add(`  Options: ${q.suggestedOptions.join(', ')}`);
        }
      });
      blank();
    }
  }

  // Assumptions
  if (p.assumptions.length > 0) {
    add('## Assumptions');
    p.assumptions.forEach((a) => {
      add(`- **${a.assumption}** — ${a.reasoning}`);
      add(`  Affects: ${a.affectedAreas.join(', ')}`);
    });
    blank();
  }

  // Domain Context
  if (p.domainContext.length > 0) {
    add('## Domain Context');
    p.domainContext.forEach((c) => add(`- ${c}`));
    blank();
  }

  return lines.join('\n');
};
