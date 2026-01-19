import { Injectable } from '@nestjs/common';
import { Project } from '../../plans/projects/entities/project.entity';
import { getModel } from '../../ai/models/models';
import { SystemMessage } from '@langchain/core/messages';
import { TimelinePoint } from '../entities/timeline-point.entity';
import { Milestone } from '../../plans/milestones/entities/milestone.entity';
import { TimelineEventHydrated } from '../types/entity';

@Injectable()
export class TimelineAiService {
  async generateTimelinePointContent({
    project,
    timelinePoint,
    events,
  }: {
    project: Project;
    timelinePoint: TimelinePoint;
    events: TimelineEventHydrated[];
  }): Promise<string> {
    const model = getModel('gpt-4o-mini', 0.5);
    const result = await model.invoke([
      new SystemMessage(
        `You're playing a role of mentor for a user. You look like a small cartoon fox.
User is working on the project ${project.title}. 
Description: ${project.description || 'no description'}
Essential project context: ${project.summary || 'no context provided'}
It's ${timelinePoint.projectDay} day of the project out of ${project.daysNeeded} days.

Here's a list of events that happened this day:
${JSON.stringify(events, null, 2)}

Your goal is to provide a comment summarizing what the user should focus on today to make the most progress on the project.
Especially focus on milestone that's not completed yet, because all attention is to it now. Use additional events data to provide better recommendations for the active milestone (inProgress).
Provide a concise comment (max 500 characters) that motivates the user and gives clear guidance on what to do next. 
Keep the tone positive, funny, encouraging and humble.
`,
      ),
    ]);

    return result.content as string;
  }

  async generateUpdatedTimelinePointContent({
    project,
    projectDay,
    newMilestone,
    finishedMilestones,
  }: {
    project: Project;
    projectDay: number;
    newMilestone: Milestone;
    finishedMilestones: Milestone[];
  }): Promise<string> {
    const model = getModel('gpt-4o-mini', 0.5);
    const result = await model.invoke([
      new SystemMessage(
        `You're playing a role of mentor for a user. You look like a small cartoon fox.
User is working on the project ${project.title}. 
Description: ${project.description || 'no description'}
Essential project context: ${project.summary || 'no context provided'}
It's ${projectDay} day of the project out of ${project.daysNeeded} days.

User finished today these milestones:
${JSON.stringify(finishedMilestones, null, 2)}

And started to work on this milestone:
${JSON.stringify(newMilestone, null, 2)}

Your goal is to provide a comment summarizing what the user should focus on today to make the most progress on the project.
Encourage current progress on the project. Take into consideration time spent on previous milestones and project in general.
Provide a concise comment (max 500 characters) that motivates the user and gives clear guidance on what to do next. 
Keep the tone positive, funny, encouraging and humble.
`,
      ),
    ]);

    return result.content as string;
  }
}
