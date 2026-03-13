import { Injectable } from '@nestjs/common';
import { Project } from '../entities/project.entity';
import { getModel } from '../../../ai/models/models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Shaping } from '../../../shaping/entities/shaping.entity';
import { PROJECT_SOUL_SCHEMA, ProjectSoul } from '../types/entity';
import {
  SOUL_SYSTEM_PROMPT,
  GENERATE_UPDATED_SOUL_PROMPT,
} from '../prompts/soul';

@Injectable()
export class SoulAiService {
  async generateSoul(project: Project, shaping: Shaping): Promise<ProjectSoul> {
    const model = getModel('claude-sonnet-4-6', 0.3);
    const structuredModel = model.withStructuredOutput<ProjectSoul>(
      PROJECT_SOUL_SCHEMA,
      { name: 'ProjectSoul' },
    );

    const conversation = shaping.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    return structuredModel.invoke([
      new SystemMessage(SOUL_SYSTEM_PROMPT),
      new HumanMessage(
        `Here is a summary of the project idea:
Title: ${project.title}
Description: ${project.description}
Summary: ${project.summary}

Here is the full conversation:

${conversation}

Extract the project profile.`,
      ),
    ]);
  }

  async generateUpdatedSoul(
    currentSoul: ProjectSoul,
    changeDescription: string,
  ): Promise<ProjectSoul> {
    const model = getModel('claude-sonnet-4-6', 0.3);
    const structuredModel = model.withStructuredOutput<ProjectSoul>(
      PROJECT_SOUL_SCHEMA,
      { name: 'ProjectSoul' },
    );

    return structuredModel.invoke([
      new SystemMessage(GENERATE_UPDATED_SOUL_PROMPT),
      new HumanMessage(
        `Current profile:\n${JSON.stringify(currentSoul, null, 2)}\n\nChanges to apply:\n${changeDescription}`,
      ),
    ]);
  }
}
