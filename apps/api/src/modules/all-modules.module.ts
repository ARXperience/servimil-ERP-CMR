import { Module } from '@nestjs/common';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { LegalModule } from './legal/legal.module';
import { AiModule } from './ai/ai.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { ContentStudioModule } from './content-studio/content-studio.module';

@Module({
  imports: [
    WhatsappModule,
    LegalModule,
    AiModule,
    DocumentsModule,
    NotificationsModule,
    WebhooksModule,
    ReportsModule,
    AdminModule,
    ContentStudioModule,
  ],
})
export class AllModulesModule {}
// Note: This file is just to quickly bundle them, usually they would go directly to AppModule.
