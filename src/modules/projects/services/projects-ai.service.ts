import { Injectable } from '@nestjs/common';
import { DallEAPIWrapper } from '@langchain/openai';
import { Project } from '../entities/project.entity';

@Injectable()
export class ProjectsAiService {
  async generateLogo(project: Project): Promise<string> {
    const tool = new DallEAPIWrapper({
      n: 1,
      model: 'dall-e-3',
      size: '1024x1024',
      dallEResponseFormat: 'b64_json',
    });

    return tool.invoke(`Generate a logo for this project idea:
Title: ${project.title}
Description: ${project.description}
Context: ${project.summary}

Make image in minimalistic style, with simple shapes and limited colors.
Don't include any text in the image.
Make it as simple as possible, so it can be easily recognized and remembered.
`);
  }
}
