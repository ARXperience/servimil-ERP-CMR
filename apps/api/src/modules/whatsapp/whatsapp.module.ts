import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappSessionManager } from './whatsapp-session.manager';
import { WhatsappAiService } from './whatsapp-ai.service';
import { GoogleSheetsService } from './google-sheets.service';
import { WhatsappCrmSyncService } from './whatsapp-crm-sync.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, WhatsappSessionManager, WhatsappAiService, GoogleSheetsService, WhatsappCrmSyncService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
