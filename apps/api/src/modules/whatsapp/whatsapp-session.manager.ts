import { Injectable, Logger } from '@nestjs/common';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  WASocket,
  AnyMessageContent,
} from '@whiskeysockets/baileys';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class WhatsappSessionManager {
  private readonly logger = new Logger(WhatsappSessionManager.name);
  private sockets: Map<string, WASocket> = new Map();
  private qrCodes: Map<string, string> = new Map();
  private connectingSessions: Set<string> = new Set();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async connectSession(sessionId: string) {
    if (this.connectingSessions.has(sessionId)) {
      this.logger.debug(`[${sessionId}] Already connecting, skipping...`);
      return;
    }
    
    try {
      this.connectingSessions.add(sessionId);
      this.logger.log(`[${sessionId}] Starting connectSession...`);
      const authDir = path.join(process.cwd(), 'whatsapp-auth', sessionId);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
        this.logger.log(`[${sessionId}] Created auth directory`);
      }

      this.logger.log(`[${sessionId}] Fetching auth state...`);
      const { state, saveCreds } = await useMultiFileAuthState(authDir);
      
      this.logger.log(`[${sessionId}] Fetching baileys version...`);
      const { version } = await fetchLatestBaileysVersion().catch(e => {
        this.logger.warn(`[${sessionId}] Failed to fetch version, using default. Error: ${e.message}`);
        return { version: [2, 3000, 1015901307] as any };
      });

      this.logger.log(`[${sessionId}] Version fetched: ${version}. Initializing socket...`);
      const pino = require('pino');
      const { Browsers } = require('@whiskeysockets/baileys');
      const socket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.windows('Chrome'),
        keepAliveIntervalMs: 30000,
        syncFullHistory: false, // Prevents memory crashes on massive histories
      });

      this.sockets.set(sessionId, socket);
      this.logger.log(`[${sessionId}] Socket initialized and stored`);

      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrDataUrl = await QRCode.toDataURL(qr);
            this.qrCodes.set(sessionId, qrDataUrl);
            this.logger.log(`[${sessionId}] QR Code generated and saved to DB`);
            await this.prisma.whatsappSession.update({
              where: { id: sessionId },
              data: { 
                qrCode: qrDataUrl,
                status: 'QR_REQUIRED'
              },
            });
          } catch (e) {
            this.logger.error(`[${sessionId}] Error generating QR data URL`, e);
          }
        }

        if (connection === 'close') {
          this.connectingSessions.delete(sessionId);
          
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          this.logger.warn(`[${sessionId}] Connection closed (Status: ${statusCode}). Reconnecting: ${shouldReconnect}`);
          
          if (shouldReconnect) {
            setTimeout(() => this.connectSession(sessionId), 5000);
          } else {
            this.sockets.delete(sessionId);
            this.qrCodes.delete(sessionId);
            await this.prisma.whatsappSession.update({
              where: { id: sessionId },
              data: { status: 'DISCONNECTED', qrCode: null },
            });
            fs.rmSync(authDir, { recursive: true, force: true });
          }
        } else if (connection === 'open') {
          this.connectingSessions.delete(sessionId);
          this.logger.log(`[${sessionId}] Session connected successfully!`);
          this.qrCodes.delete(sessionId);
          await this.prisma.whatsappSession.update({
            where: { id: sessionId },
            data: { status: 'CONNECTED', qrCode: null },
          });
        }
      });

      socket.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
          for (const msg of m.messages) {
            if (!msg.key.fromMe && msg.message) {
              await this.handleIncomingMessage(sessionId, msg);
            }
          }
        }
      });

      socket.ev.on('messaging-history.set', async ({ chats, contacts, messages, isLatest }) => {
        this.logger.log(`[${sessionId}] Received messaging-history.set with ${chats.length} chats and ${messages.length} messages`);
        try {
          for (const chat of chats) {
            if (chat.id === 'status@broadcast') continue;
            
            const phoneNumber = chat.id.split('@')[0];
            const name = chat.name || contacts.find(c => c.id === chat.id)?.name || phoneNumber;
            
            await this.prisma.conversation.upsert({
              where: { sessionId_remoteJid: { sessionId, remoteJid: chat.id } },
              create: {
                sessionId,
                remoteJid: chat.id,
                phoneNumber,
                name,
                unreadCount: chat.unreadCount || 0,
                status: 'open',
              },
              update: {
                name,
                unreadCount: chat.unreadCount || 0,
              }
            });
          }

          // Optionally process historical messages to populate DB
          for (const msg of messages) {
            if (msg.key.remoteJid && msg.key.remoteJid !== 'status@broadcast') {
              await this.handleIncomingMessage(sessionId, msg, true);
            }
          }
        } catch (err) {
          this.logger.error(`[${sessionId}] Error processing history sync`, err);
        }
      });

    } catch (error) {
      this.connectingSessions.delete(sessionId);
      this.logger.error(`Error connecting session ${sessionId}`, error);
    }
  }

  async getQr(sessionId: string): Promise<string | undefined> {
    const memQr = this.qrCodes.get(sessionId);
    if (memQr) return memQr;

    // Fallback to database (if hot reloaded)
    const session = await this.prisma.whatsappSession.findUnique({
      where: { id: sessionId },
      select: { qrCode: true, status: true }
    });

    if (session?.status !== 'CONNECTED') {
      // Reconnect if the socket is lost from memory
      if (!this.sockets.has(sessionId)) {
        this.logger.log(`[${sessionId}] Socket missing in memory, reconnecting...`);
        this.connectSession(sessionId);
      }
    }

    return session?.qrCode || undefined;
  }

  async disconnectSession(sessionId: string) {
    const socket = this.sockets.get(sessionId);
    if (socket) {
      socket.logout();
      this.sockets.delete(sessionId);
      this.qrCodes.delete(sessionId);
    }
  }

  async sendMessage(sessionId: string, jid: string, content: AnyMessageContent) {
    const socket = this.sockets.get(sessionId);
    if (!socket) {
      throw new Error('Socket not connected');
    }
    // format jid - handle @s.whatsapp.net, @g.us (groups), and @lid (linked devices)
    let formattedJid = jid;
    if (!jid.includes('@')) {
      formattedJid = `${jid}@s.whatsapp.net`;
    }
    this.logger.log(`[${sessionId}] Sending message to ${formattedJid}`);
    
    try {
      const result = await Promise.race([
        socket.sendMessage(formattedJid, content),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Send timeout after 30s')), 30000))
      ]);
      this.logger.log(`[${sessionId}] Message sent successfully to ${formattedJid}`);
      return result;
    } catch (error) {
      this.logger.error(`[${sessionId}] Failed to send message to ${formattedJid}: ${error.message}`);
      throw error;
    }
  }

  private async handleIncomingMessage(sessionId: string, msg: any, isHistory = false) {
    const remoteJid = msg.key.remoteJid;
    if (!remoteJid || remoteJid === 'status@broadcast') return;

    const phoneNumber = remoteJid.split('@')[0];
    const pushName = msg.pushName || phoneNumber;

    let body = '';
    let type = 'TEXT';
    
    // Check if it's an audio message
    const isAudio = !!(msg.message?.audioMessage);
    
    if (isAudio) {
      type = 'AUDIO';
      body = '🎵 Audio';
    } else if (msg.message?.conversation) {
      body = msg.message.conversation;
    } else if (msg.message?.extendedTextMessage) {
      body = msg.message.extendedTextMessage.text;
    } else if (msg.message?.imageMessage) {
      type = 'IMAGE';
      body = msg.message.imageMessage.caption || '📷 Imagen';
    } else if (msg.message?.documentMessage) {
      type = 'DOCUMENT';
      body = msg.message.documentMessage.fileName || '📄 Documento';
    }

    // Find or create conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: { remoteJid, sessionId },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          sessionId,
          remoteJid,
          phoneNumber,
          name: pushName,
          status: 'open',
        },
      });
    }

    const isFromMe = msg.key.fromMe === true;

    // Save message (upsert to avoid duplicates in history sync)
    const savedMessage = await this.prisma.message.upsert({
      where: { whatsappId: msg.key.id || 'missing' },
      create: {
        conversationId: conversation.id,
        whatsappId: msg.key.id,
        body,
        type: type as any,
        direction: isFromMe ? 'OUTBOUND' : 'INBOUND',
        status: isFromMe ? 'SENT' : 'DELIVERED',
        createdAt: msg.messageTimestamp ? new Date(Number(msg.messageTimestamp) * 1000) : new Date(),
      } as any,
      update: {} // do not update if exists
    });

    // Update conversation if this is the latest message
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: msg.messageTimestamp ? new Date(Number(msg.messageTimestamp) * 1000) : new Date(),
        lastMessageText: body,
        unreadCount: (!isFromMe && !isHistory) ? { increment: 1 } : undefined,
      },
    });

    if (isAudio && !isHistory && !isFromMe) {
      // Download audio for transcription
      try {
        const socket = this.sockets.get(sessionId);
        if (socket) {
          const pino = require('pino');
          const { downloadMediaMessage } = require('@whiskeysockets/baileys');
          const buffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            { 
              logger: pino({ level: 'silent' }) as any,
              reuploadRequest: socket.updateMediaMessage
            }
          );
          
          this.eventEmitter.emit('whatsapp.audio.received', {
            buffer,
            messageId: savedMessage.id,
            conversation,
          });
        }
      } catch (err) {
        this.logger.error(`[${sessionId}] Failed to download audio message`, err);
      }
    }

    if ((type === 'IMAGE' || type === 'DOCUMENT') && !isHistory && !isFromMe) {
      try {
        const socket = this.sockets.get(sessionId);
        if (socket) {
          const pino = require('pino');
          const { downloadMediaMessage } = require('@whiskeysockets/baileys');
          const buffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            { 
              logger: pino({ level: 'silent' }) as any,
              reuploadRequest: socket.updateMediaMessage
            }
          );
          
          // Save file
          const extension = type === 'IMAGE' ? 'jpg' : (msg.message?.documentMessage?.fileName?.split('.').pop() || 'pdf');
          const fileName = `wa_${savedMessage.id}.${extension}`;
          const uploadDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, buffer);

          // Save to DB Document table
          const document = await this.prisma.document.create({
            data: {
              name: msg.message?.documentMessage?.fileName || 'Imagen Recibida WhatsApp',
              originalName: msg.message?.documentMessage?.fileName || `Imagen_WhatsApp.${extension}`,
              mimeType: msg.message?.documentMessage?.mimetype || msg.message?.imageMessage?.mimetype || 'application/octet-stream',
              size: buffer.length,
              url: `/uploads/${fileName}`,
              storageKey: fileName,
              clientId: conversation.clientId,
              category: 'GENERAL',
            } as any,
          });

          this.logger.log(`[${sessionId}] Media downloaded and Document created: ${document.id}`);

          this.eventEmitter.emit('whatsapp.document.received', {
            document,
            buffer,
            mimeType: document.mimeType,
            messageId: savedMessage.id,
            conversation,
          });
        }
      } catch (err) {
        this.logger.error(`[${sessionId}] Failed to download media message`, err);
      }
    }

    // Only emit standard message event if it's new, inbound, and has text
    if (!isHistory && !isAudio && !isFromMe && type === 'TEXT') {
      this.logger.log(`[${sessionId}] Emitting whatsapp.message.received for ${conversation.remoteJid}`);
      this.eventEmitter.emit('whatsapp.message.received', {
        message: savedMessage,
        conversation,
      });
    }
  }
}
