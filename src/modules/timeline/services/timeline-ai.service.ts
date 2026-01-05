import { Injectable } from '@nestjs/common';
import { Project } from '../../plans/projects/entities/project.entity';
import { getModel } from '../../ai/models/models';
import { SystemMessage } from '@langchain/core/messages';
import { TimelinePoint } from '../entities/timeline-point.entity';
import { Milestone } from '../../plans/milestones/entities/milestone.entity';

@Injectable()
export class TimelineAiService {
  async generateTimelinePointContent({
    project,
    projectDay,
    activeMilestones,
    previousTimelinePoint,
  }: {
    project: Project;
    projectDay: number;
    activeMilestones: Milestone[];
    previousTimelinePoint: TimelinePoint | null;
  }): Promise<string> {
    const model = getModel('gpt-4o-mini', 0.5);
    const result = await model.invoke([
      new SystemMessage(
        `You're playing a role of mentor for a user. You look like a small cartoon fox.
User is working on the project ${project.title}. 
Description: ${project.description || 'no description'}
Essential project context: ${project.summary || 'no context provided'}
It's ${projectDay} day of the project out of ${project.daysNeeded} days.

User currently works on the following milestones:
${JSON.stringify(activeMilestones, null, 2)}


${
  previousTimelinePoint
    ? `The previous record of work: 
Project Day ${previousTimelinePoint.projectDay}. 
Comment: ${previousTimelinePoint.comment}. 
Milestone IDs worked on: ${previousTimelinePoint.milestoneIds.join(', ')}`
    : ''
}

Your goal is to provide a comment summarizing what the user should focus on today to make the most progress on the project.
Provide a concise comment (max 500 characters) that motivates the user and gives clear guidance on what to do next. 
Keep the tone positive, funny, encouraging and humble.
`,
      ),
    ]);

    return result.content as string;
  }
}
