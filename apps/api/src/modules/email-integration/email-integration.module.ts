import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GmailService } from './gmail.service';
import { EmailAiProcessorService } from './email-ai-processor.service';
import { EmailIntegrationController } from './email-integration.controller';
import { AiHubModule } from '../ai-hub/ai-hub.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), AiHubModule, PrismaModule],
  controllers: [EmailIntegrationController],
  providers: [GmailService, EmailAiProcessorService],
  exports: [GmailService, EmailAiProcessorService],
})
export class EmailIntegrationModule {}
