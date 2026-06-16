import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenerativeAI, FunctionDeclaration, Tool } from '@google/generative-ai';

@Injectable()
export class AiRouterService {
  private readonly logger = new Logger(AiRouterService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initProviders();
  }

  private async initProviders() {
    const configRow = await this.prisma.systemConfig.findUnique({
      where: { key: 'gemini_api_key' },
    }).catch(() => null);

    const apiKey = (configRow?.value as any)?.key
      || this.configService.get('GEMINI_API_KEY')
      || 'AIzaSyAA5HDZNTgpg_LZhu1UnuBsOm4sAAC_pT0'; // fallback temp

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey.trim());
      this.logger.log('Gemini AI Provider initialized');
    }
  }

  async callGemini(messageParts: string | Array<any>, toolsDef?: Tool[], history?: any[]) {
    if (!this.genAI) throw new Error('Gemini not initialized');
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: toolsDef,
    });

    try {
      const chat = model.startChat({
        history: history || [],
      });
      const result = await chat.sendMessage(messageParts);
      const response = result.response;
      
      const functionCalls = response.functionCalls();
      const text = response.text();

      return {
        text,
        functionCalls,
        usage: response.usageMetadata,
      };
    } catch (error) {
      this.logger.error('Error calling Gemini', error);
      throw error;
    }
  }
}
