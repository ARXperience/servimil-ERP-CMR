import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiProvider } from './providers/ai-provider.interface';
import { OpenAiProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { AnalyzeDto, SummarizeDto, ClassifyDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  private activeProvider: AiProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly openAiProvider: OpenAiProvider,
    private readonly geminiProvider: GeminiProvider,
    private readonly claudeProvider: ClaudeProvider,
  ) {
    // Default to OpenAI, can be configurable via DB or ENV
    this.activeProvider = this.openAiProvider;
  }

  setProvider(providerName: 'openai' | 'gemini' | 'claude') {
    switch (providerName) {
      case 'openai':
        this.activeProvider = this.openAiProvider;
        break;
      case 'gemini':
        this.activeProvider = this.geminiProvider;
        break;
      case 'claude':
        this.activeProvider = this.claudeProvider;
        break;
    }
  }

  async analyze(dto: AnalyzeDto) {
    const prompt = `Analyze the following text considering this context: ${dto.context || 'None'}\n\nText: ${dto.text}`;
    const result = await this.activeProvider.generateText(prompt);
    
    // Store analysis
    await this.prisma.aiAnalysis.create({
      data: {
        type: 'ANALYSIS',
        prompt: dto.text,
        response: result,
      } as any,
    });

    return { result };
  }

  async summarize(dto: SummarizeDto) {
    const prompt = `Provide a concise summary of the following text:\n\n${dto.text}`;
    const result = await this.activeProvider.generateText(prompt);

    await this.prisma.aiAnalysis.create({
      data: {
        type: 'SUMMARY',
        prompt: dto.text,
        response: result,
      } as any,
    });

    return { result };
  }

  async classify(dto: ClassifyDto) {
    const prompt = `Classify the following text into one of these categories: ${dto.categories.join(', ')}.\n\nText: ${dto.text}`;
    const result = await this.activeProvider.generateText(prompt);

    await this.prisma.aiAnalysis.create({
      data: {
        type: 'CLASSIFICATION',
        prompt: dto.text,
        response: result,
      } as any,
    });

    return { result };
  }

  async scoreLead(leadData: any) {
    const prompt = `Score this lead from 1 to 100 based on conversion likelihood. Provide output as JSON with "score" and "reasoning".\n\nLead: ${JSON.stringify(leadData)}`;
    const result = await this.activeProvider.generateJSON(prompt);
    return result;
  }

  async scoreCredit(creditData: any) {
    const prompt = `Assess the credit risk for this profile from 1 (high risk) to 100 (low risk). Provide output as JSON with "score" and "riskFactors".\n\nProfile: ${JSON.stringify(creditData)}`;
    const result = await this.activeProvider.generateJSON(prompt);
    return result;
  }

  async suggestResponse(message: string, context?: string) {
    const prompt = `Suggest a professional response to this message. Context: ${context || 'None'}\n\nMessage: ${message}`;
    const result = await this.activeProvider.generateText(prompt);
    return { result };
  }

  async getAnalyses() {
    return this.prisma.aiAnalysis.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUsage() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analyses = await this.prisma.aiAnalysis.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        id: true,
        provider: true,
        model: true,
        type: true,
        tokensUsed: true,
        processingTime: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalTokens = 0;
    let totalRequests = 0;
    const dailyUsage: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};

    analyses.forEach((analysis) => {
      totalRequests++;
      const tokens = analysis.tokensUsed || 0;
      totalTokens += tokens;

      const day = analysis.createdAt.toISOString().split('T')[0];
      dailyUsage[day] = (dailyUsage[day] || 0) + tokens;

      typeBreakdown[analysis.type] = (typeBreakdown[analysis.type] || 0) + tokens;
    });

    // Cost estimation (for gemini-2.5-flash: ~$0.075 per 1M tokens)
    const costPerMillion = 0.075; 
    const estimatedCost = (totalTokens / 1_000_000) * costPerMillion;

    // Format dailyUsage for frontend charts
    const chartData = Object.entries(dailyUsage).map(([date, tokens]) => ({
      date,
      tokens,
    }));

    return {
      totalTokens,
      totalRequests,
      estimatedCost,
      chartData,
      typeBreakdown,
    };
  }
}
