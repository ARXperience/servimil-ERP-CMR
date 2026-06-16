import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async createWebhook(data: any) {
    return this.prisma.webhook.create({
      data: {
        name: data.name || 'Webhook',
        url: data.url,
        events: data.events,
        isActive: data.isActive ?? true,
        secret: data.secret,
      } as any,
    });
  }

  async getWebhooks() {
    return this.prisma.webhook.findMany();
  }

  async getWebhook(id: string) {
    return this.prisma.webhook.findUnique({ where: { id } });
  }

  async updateWebhook(id: string, data: any) {
    return this.prisma.webhook.update({
      where: { id },
      data,
    });
  }

  async deleteWebhook(id: string) {
    return this.prisma.webhook.delete({ where: { id } });
  }

  // Called when an event occurs to dispatch to registered URLs
  async dispatch(event: string, payload: any) {
    const hooks = await this.prisma.webhook.findMany({
      where: { isActive: true, events: { has: event } },
    });

    for (const hook of hooks) {
      // In a real app, send via queue
      console.log(`Dispatching ${event} to ${hook.url}`);
    }
  }
}
