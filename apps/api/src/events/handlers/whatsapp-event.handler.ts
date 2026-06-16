import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventsGateway } from '../../websockets/events.gateway';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WhatsappEventHandler {
  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('whatsapp.message.received')
  handleMessageReceived(payload: { message: any; conversation: any }) {
    // Broadcast via WebSockets
    this.eventsGateway.emitToRoom('whatsapp_dashboard', 'newMessage', payload.message);
    
    // If assigned to a user, notify them
    if (payload.conversation.assignedToId) {
      this.eventsGateway.sendNotification(payload.conversation.assignedToId, {
        title: 'New WhatsApp Message',
        content: `From ${payload.conversation.contactName || payload.conversation.phoneNumber}`,
        type: 'WHATSAPP',
      });
    }
  }
}
