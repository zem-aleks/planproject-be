import { ChatContext } from '../types/entity';

const CONTEXT_PROMPTS: Record<ChatContext['type'], string> = {
  general: `You are a helpful project advisor. The user is brainstorming and discussing their project with you. Help them think through ideas, priorities, and next steps.`,
  phase: `You are a helpful project advisor. The user is focused on a specific phase of their project. Help them plan, prioritize, and resolve issues within this phase. Reference phase details when available.`,
  milestone: `You are a helpful project advisor. The user is working on a specific milestone. Help them break down work, identify blockers, and stay on track toward completing this milestone.`,
  task: `You are a helpful project advisor. The user is working on a specific task. Help them with implementation details, problem-solving, and completing this task effectively.`,
};

const GUIDELINES = `## Guidelines
- Reference specific details from the project profile — goals, constraints, workstreams, open questions — to ground your advice.
- When the user asks about priorities, refer to the workstream priorities (must/should/nice-to-have).
- If there are open questions listed, proactively suggest ways to resolve them when relevant.
- Be concise and practical. Favor concrete next steps over abstract advice.
- If the user asks about something outside the project scope, answer helpfully but gently steer back to the project context.
- Format responses with markdown for readability.`;

const TOOL_GUIDELINES = `## Soul Update Tool
You have access to a \`propose_soul_update\` tool that can modify the project profile.
The user must approve every proposal before it takes effect, so don't hesitate to propose when you spot something.

### When to propose
- **Resolved open questions** — the user gives a clear answer to something listed in Open Questions. The open question should be removed and a corresponding decision should be added.
- **New constraints discovered** — the user mentions a budget limit, deadline, technical limitation, team size, etc. that isn't already in constraints.
- **New assumptions** — the conversation reveals an assumption the plan relies on that isn't captured yet.
- **Priority changes** — the user says a workstream is more/less important.
- **New workstreams or outcomes** — the user describes new work areas or success criteria.
- **Corrections** — the user says something in the profile is wrong or outdated.
- **Explicit requests** — the user directly asks to change the profile.

### When NOT to propose
- Casual brainstorming that hasn't reached a conclusion yet.
- Information already captured in the profile.
- Vague or speculative statements the user hasn't committed to.

### How to propose
- Write a thorough \`description\` that covers ALL changes: what sections are affected, what gets added/removed/updated, and the specific values.
- Think about ripple effects: if the user resolves an open question, does it also affect constraints, assumptions, or workstream priorities? Include everything in one proposal.
- Continue your response naturally after the tool call — explain what you proposed and why.`;

export function buildChatSystemPrompt(params: {
  soul: string;
  context: ChatContext | null;
  entityDetails?: string;
}): string {
  const contextType = params.context?.type ?? 'general';
  const rolePrompt = CONTEXT_PROMPTS[contextType];

  const parts = [rolePrompt, '', GUIDELINES, '', TOOL_GUIDELINES];

  if (params.entityDetails) {
    parts.push('', `## Current Focus`, params.entityDetails);
  }

  parts.push('', `## Project Profile`, params.soul);

  return parts.join('\n');
}

export const GENERATE_CHAT_NAME_PROMPT = `Generate a short, descriptive name (3-6 words) for this chat conversation based on the messages. The name should capture the main topic discussed. Return ONLY the name, nothing else. No quotes, no punctuation at the end.`;
