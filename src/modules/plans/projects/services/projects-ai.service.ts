import { Injectable } from '@nestjs/common';
import { Project } from '../entities/project.entity';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProjectsAiService {
  constructor(private readonly configService: ConfigService) {}

  private getOpenai() {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const openaiOrgId = this.configService.get<string>('OPENAI_ORG_ID');
    if (!openaiKey) {
      throw new Error('No API KEY');
    }

    return new OpenAI({
      apiKey: openaiKey,
      organization: openaiOrgId,
    });
  }

  private async generateImage(prompt: string): Promise<string | null> {
    const openai = this.getOpenai();

    const response = await openai.images.generate({
      model: 'gpt-image-1-mini',
      prompt,
      n: 1,
      background: 'auto',
      size: '1024x1024',
    });

    if (!response.data) {
      return null;
    }

    return response.data[0].b64_json || null;
  }

  async generateLogo(project: Project): Promise<string | null> {
    const prompt = `Generate a logo for this project idea:
Title: ${project.title}
Description: ${project.description}
Context: ${project.summary}

Make image in minimalistic style, with simple shapes and limited colors.
Don't include any text in the image.
Make it as simple, cool and recognizable.
Never use human parts, like head, hands, brain or smiles.
`;

    return this.generateImage(prompt);
  }

  async regenerateLogo(project: Project): Promise<string | null> {
    const soul = project.soul;

    const workstreams = soul?.workstreams?.map((w) => w.name).join(', ');

    const outcomes = soul?.desiredOutcomes?.map((o) => o.outcome).join(', ');

    const prompt = `Generate an updated logo for this project:
Title: ${project.title}
Summary: ${soul?.summary || project.summary}
Domain: ${soul?.domain || 'general'}
Key workstreams: ${workstreams || 'N/A'}
Desired outcomes: ${outcomes || 'N/A'}

Make image in minimalistic style, with simple shapes and limited colors.
Don't include any text in the image.
Make it as simple, cool and recognizable.
Never use human parts, like head, hands, brain or smiles.
`;

    return this.generateImage(prompt);

    //     const generateImageTool = new DynamicTool({
    //       name: 'generate_image',
    //       description:
    //         'Generate an image from a text prompt. Returns base64-encoded PNG bytes.',
    //       func: async (prompt: string) => {
    //         const img = await openai.images.generate({
    //           model: 'gpt-image-1',
    //           prompt,
    //           n: 1,
    //           size: '1024x1024',
    //           // GPT image models return base64; output_format applies to GPT image models
    //           // output_format: "png", // optional; default is png
    //         });
    //
    //         return img.data[0].b64_json; // base64 string
    //       },
    //     });
    //
    //     return tool.invoke(`Generate a logo for this project idea:
    // Title: ${project.title}
    // Description: ${project.description}
    // Context: ${project.summary}
    //
    // Make image in minimalistic style, with simple shapes and limited colors.
    // Don't include any text in the image.
    // Make it as simple as possible, so it can be easily recognized and remembered.
    // `);
  }
}
