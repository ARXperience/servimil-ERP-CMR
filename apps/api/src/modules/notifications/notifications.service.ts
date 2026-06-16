import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../websockets/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async createNotification(userId: string, title: string, content: string, type: string) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body: content,
        channel: 'IN_APP',
        status: 'PENDING',
      } as any,
    });

    // Send real-time notification
    this.eventsGateway.sendNotification(userId, notification);

    return notification;
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { status: 'READ', readAt: new Date() } as any,
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, status: 'PENDING' } as any,
      data: { status: 'READ', readAt: new Date() } as any,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null } as any,
    });
    return { count };
  }
}
