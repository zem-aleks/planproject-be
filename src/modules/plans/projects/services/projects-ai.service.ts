import { Injectable } from '@nestjs/common';
import { Project } from '../entities/project.entity';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProjectsAiService {
  constructor(private readonly configService: ConfigService) {}

  async generateLogo(project: Project): Promise<string | null> {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const openaiOrgId = this.configService.get<string>('OPENAI_ORG_ID');
    if (!openaiKey) {
      throw new Error('No API KEY');
    }

    const openai = new OpenAI({
      apiKey: openaiKey,
      organization: openaiOrgId,
    });

    const prompt = `Generate a logo for this project idea:
Title: ${project.title}
Description: ${project.description}
Context: ${project.summary}

Make image in minimalistic style, with simple shapes and limited colors.
Don't include any text in the image.
Make it as simple as possible, so it can be easily recognized and remembered.
`;

    const response = await openai.images.generate({
      model: 'gpt-image-1-mini',
      prompt,
      n: 1,
      // response_format: 'b64_json',
      background: 'transparent',
      size: '1024x1024',
    });

    console.log(response);

    if (!response.data) {
      return null;
    }

    return response.data[0].b64_json || null;

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
