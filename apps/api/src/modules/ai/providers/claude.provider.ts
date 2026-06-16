import { Injectable } from '@nestjs/common';
import { AiProvider } from './ai-provider.interface';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ClaudeProvider implements AiProvider {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'dummy',
    });
  }

  async generateText(prompt: string, options?: any): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: options?.model || 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    return (response.content[0] as any).text;
  }

  async generateJSON(prompt: string, schema?: any, options?: any): Promise<any> {
    const fullPrompt = `${prompt}\n\nPlease respond with only valid JSON.`;
    const response = await this.anthropic.messages.create({
      model: options?.model || 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: fullPrompt }],
    });
    try {
      const text = (response.content[0] as any).text;
      return JSON.parse(text);
    } catch (error) {
      return {};
    }
  }

  async analyzeImage(imageBuffer: Buffer, prompt: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBuffer.toString('base64'),
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });
    return (response.content[0] as any).text;
  }
}
