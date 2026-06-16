import { Module } from '@nestjs/common';
import { ContentStudioController } from './content-studio.controller';
import { ContentStudioService } from './content-studio.service';
import { ContentStrategyService } from './services/content-strategy/content-strategy.service';
import { ContentCalendarService } from './services/content-calendar/content-calendar.service';
import { ImageGenerationService } from './services/image-generation/image-generation.service';
import { BrandAssetsService } from './services/brand-assets/brand-assets.service';
import { InstagramIntegrationService } from './services/instagram-integration/instagram-integration.service';
import { ApprovalWorkflowService } from './services/approval-workflow/approval-workflow.service';
import { CreativeLogsService } from './services/creative-logs/creative-logs.service';
import { ContentAnalyticsService } from './services/content-analytics/content-analytics.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContentStudioController],
  providers: [ContentStudioService, ContentStrategyService, ContentCalendarService, ImageGenerationService, BrandAssetsService, InstagramIntegrationService, ApprovalWorkflowService, CreativeLogsService, ContentAnalyticsService]
})
export class ContentStudioModule {}
