import {
  Controller,
  Post,
  Body,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AnalyzeDto, SummarizeDto, ClassifyDto } from './dto/ai.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze text' })
  analyze(@Body() dto: AnalyzeDto) {
    return this.aiService.analyze(dto);
  }

  @Post('summarize')
  @ApiOperation({ summary: 'Summarize text' })
  summarize(@Body() dto: SummarizeDto) {
    return this.aiService.summarize(dto);
  }

  @Post('classify')
  @ApiOperation({ summary: 'Classify text into categories' })
  classify(@Body() dto: ClassifyDto) {
    return this.aiService.classify(dto);
  }

  @Post('score-lead')
  @ApiOperation({ summary: 'Score a lead' })
  scoreLead(@Body() leadData: any) {
    return this.aiService.scoreLead(leadData);
  }

  @Post('score-credit')
  @ApiOperation({ summary: 'Score credit risk' })
  scoreCredit(@Body() creditData: any) {
    return this.aiService.scoreCredit(creditData);
  }

  @Post('suggest-response')
  @ApiOperation({ summary: 'Suggest a response to a message' })
  suggestResponse(@Body() data: { message: string; context?: string }) {
    return this.aiService.suggestResponse(data.message, data.context);
  }

  @Get('analyses')
  @ApiOperation({ summary: 'Get previous AI analyses' })
  getAnalyses() {
    return this.aiService.getAnalyses();
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get AI token usage and costs' })
  getUsage() {
    return this.aiService.getUsage();
  }
}
