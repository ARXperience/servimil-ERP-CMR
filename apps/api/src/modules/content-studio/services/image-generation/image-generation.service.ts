import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImageGenerationService {
  private apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  async generateImage(prompt: string, aspectRatio: string = '1:1', brandContext?: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY no está configurada');
      }

      // Use the new Gemini image generation model (replaces deprecated Imagen 3)
      const model = 'gemini-3.1-flash-image';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

      let finalPrompt = `Generate a high-quality, professional image for Instagram. The image MUST have a clear Colombian context, featuring characteristics of Colombia's geography, regions, cities, architecture, culture, or people. `;
      if (brandContext) {
        finalPrompt += `\n\nBRANDING REQUIREMENTS: STRICTLY ADHERE to the following brand identity (colors, style, typography feel): ${brandContext}. `;
      }
      finalPrompt += `\n\nSCENE DESCRIPTION: ${prompt}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: finalPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio: aspectRatio,
            }
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini Image API Error:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData?.error?.message || 'Error en Gemini Image API');
      }

      const data = await response.json();

      // Extract the image from the response parts
      if (data.candidates && data.candidates.length > 0) {
        const parts = data.candidates[0].content?.parts || [];
        
        for (const part of parts) {
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            const base64 = part.inlineData.data;
            return `data:${mimeType};base64,${base64}`;
          }
        }
      }

      throw new Error('No se generó ninguna imagen válida en la respuesta de Gemini');
    } catch (error) {
      console.error('Error generating image:', error);
      throw new InternalServerErrorException(error.message || 'Error al generar imagen');
    }
  }
}
