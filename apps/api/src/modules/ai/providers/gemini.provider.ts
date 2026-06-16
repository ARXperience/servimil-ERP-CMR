import { Injectable } from '@nestjs/common';
import { AiProvider } from './ai-provider.interface';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiProvider implements AiProvider {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy');
  }

  async generateText(prompt: string, options?: any): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: options?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async generateJSON(prompt: string, schema?: any, options?: any): Promise<any> {
    const model = this.genAI.getGenerativeModel({ model: options?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    // Gemini 1.5 Pro natively supports JSON output if prompted properly
    const fullPrompt = `${prompt}\n\nPlease output valid JSON only.`;
    const result = await model.generateContent(fullPrompt);
    try {
      // Basic cleanup for markdown block
      let text = result.response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      return {};
    }
  }

  async analyzeImage(imageBuffer: Buffer, prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const imageParts = [
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg',
        },
      },
    ];
    const result = await model.generateContent([prompt, ...imageParts]);
    return result.response.text();
  }
}
