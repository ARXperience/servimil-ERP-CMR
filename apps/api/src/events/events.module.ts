import { Module } from '@nestjs/common';
import { WhatsappEventHandler } from './handlers/whatsapp-event.handler';
import { LeadEventHandler } from './handlers/lead-event.handler';
import { NotificationEventHandler } from './handlers/notification-event.handler';
import { WebsocketsModule } from '../websockets/websockets.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [WebsocketsModule, NotificationsModule, PrismaModule],
  providers: [WhatsappEventHandler, LeadEventHandler, NotificationEventHandler],
})
export class EventsModule {}
