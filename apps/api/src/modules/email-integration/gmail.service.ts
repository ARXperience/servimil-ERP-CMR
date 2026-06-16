import { Injectable, Logger } from '@nestjs/common';
import { google, gmail_v1 } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private oauth2Client: any;
  private gmail: gmail_v1.Gmail | null = null;
  private isConfigured = false;

  constructor(private readonly prisma: PrismaService) {
    this.init();
  }

  async init() {
    try {
      const configs = await this.prisma.systemConfig.findMany({
        where: { key: { in: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REDIRECT_URI', 'GMAIL_REFRESH_TOKEN'] } }
      });

      const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.key]: typeof curr.value === 'string' ? curr.value : (curr.value as any)?.value }), {} as any);

      if (configMap.GMAIL_CLIENT_ID && configMap.GMAIL_CLIENT_SECRET) {
        this.oauth2Client = new google.auth.OAuth2(
          configMap.GMAIL_CLIENT_ID,
          configMap.GMAIL_CLIENT_SECRET,
          configMap.GMAIL_REDIRECT_URI || 'http://localhost:3001/api/v1/email-integration/oauth2callback'
        );

        if (configMap.GMAIL_REFRESH_TOKEN) {
          this.oauth2Client.setCredentials({ refresh_token: configMap.GMAIL_REFRESH_TOKEN });
          this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
          this.isConfigured = true;
          this.logger.log('Gmail Service successfully configured and ready.');
        } else {
          this.logger.warn('Gmail Service initialized but waiting for auth. Auth URL: ' + this.getAuthUrl());
        }
      } else {
         this.logger.warn('Gmail credentials not found in SystemConfig. Running in MOCK mode.');
      }
    } catch (e: any) {
      this.logger.error('Failed to initialize GmailService: ' + e.message);
    }
  }

  getAuthUrl() {
    if (!this.oauth2Client) return null;
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify'],
    });
  }

  async getUnreadEmails() {
    if (!this.isConfigured || !this.gmail) {
      // MOCK MODE
      return [
        {
          id: `mock-msg-${Date.now()}`,
          threadId: 'mock-thread-1',
          snippet: 'Adjunto el contrato firmado de servicios jurídicos para su revisión...',
          payload: {
            headers: [
              { name: 'From', value: 'Carlos Mendoza <cmendoza@empresa-cliente.com>' },
              { name: 'Subject', value: 'Contrato firmado e inquietudes sobre el pago' },
              { name: 'Date', value: new Date().toISOString() }
            ],
            parts: [{ mimeType: 'text/plain', body: { data: Buffer.from('Hola equipo,\nAdjunto el contrato firmado de servicios jurídicos. Quisiera saber si es posible dividir el pago inicial en dos cuotas.\nQuedo atento.\nSaludos,\nCarlos Mendoza').toString('base64') } }]
          }
        }
      ];
    }

    try {
      const res = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: 10,
      });

      if (!res.data.messages || res.data.messages.length === 0) return [];

      const fullMessages = await Promise.all(
        res.data.messages.map(async (msg) => {
          const m = await this.gmail!.users.messages.get({ userId: 'me', id: msg.id! });
          return m.data;
        })
      );
      return fullMessages;
    } catch (e: any) {
      this.logger.error('Error fetching unread emails', e);
      return [];
    }
  }

  async markAsRead(messageId: string) {
    if (!this.isConfigured || !this.gmail) return;
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: { removeLabelIds: ['UNREAD'] }
      });
    } catch (e) {
      this.logger.error(`Error marking message ${messageId} as read`, e);
    }
  }

  async downloadAttachment(messageId: string, attachmentId: string) {
    if (!this.isConfigured || !this.gmail) return null;
    try {
      const res = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId
      });
      return res.data.data; // Base64url encoded
    } catch (e) {
      this.logger.error(`Error downloading attachment ${attachmentId}`, e);
      return null;
    }
  }
}
