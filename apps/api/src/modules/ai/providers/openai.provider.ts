import { Injectable } from '@nestjs/common';
import { AiProvider } from './ai-provider.interface';
import OpenAI from 'openai';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy',
    });
  }

  async generateText(prompt: string, options?: any): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: options?.model || 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0].message.content || '';
  }

  async generateJSON(prompt: string, schema?: any, options?: any): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: options?.model || 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async analyzeImage(imageBuffer: Buffer, prompt: string): Promise<string> {
    const base64Image = imageBuffer.toString('base64');
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
    });
    return response.choices[0].message.content || '';
  }
}
