import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappSessionManager } from './whatsapp-session.manager';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto, MessageType } from './dto/send-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationFilterDto } from './dto/conversation-filter.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { GoogleSheetsService } from './google-sheets.service';

@Injectable()
export class WhatsappService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionManager: WhatsappSessionManager,
    private readonly eventEmitter: EventEmitter2,
    private readonly googleSheets: GoogleSheetsService,
  ) {}

  async onModuleInit() {
    // Reconnect existing sessions
    const sessions = await this.prisma.whatsappSession.findMany({
      where: { status: 'CONNECTED' },
    });
    for (const session of sessions) {
      await this.sessionManager.connectSession(session.id);
    }
  }

  async getSessions() {
    return this.prisma.whatsappSession.findMany();
  }

  async createSession(createSessionDto: CreateSessionDto) {
    let targetUserId = createSessionDto.userId;
    
    // If no userId provided or it's a dummy one, fetch a valid user from DB
    if (!targetUserId || targetUserId === '00000000-0000-0000-0000-000000000000') {
      const firstUser = await this.prisma.user.findFirst();
      if (!firstUser) {
        throw new BadRequestException('No users found in database to assign session');
      }
      targetUserId = firstUser.id;
    }

    const session = await this.prisma.whatsappSession.create({
      data: {
        name: createSessionDto.name,
        userId: targetUserId,
        isDefault: createSessionDto.isDefault || false,
        status: 'DISCONNECTED',
      } as any,
    });

    await this.sessionManager.connectSession(session.id);
    return session;
  }

  async getQr(id: string) {
    const session = await this.prisma.whatsappSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');

    const qr = await this.sessionManager.getQr(id);
    
    if (!qr) {
      if (session.status === 'CONNECTED') {
        return { qr: null, connected: true };
      }
      // Still generating
      return { qr: null, connected: false };
    }
    
    return { qr, connected: false };
  }

  async disconnectSession(id: string) {
    const session = await this.prisma.whatsappSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');

    await this.sessionManager.disconnectSession(id);
    return this.prisma.whatsappSession.update({
      where: { id },
      data: { status: 'DISCONNECTED' },
    });
  }

  async deleteSession(id: string) {
    await this.disconnectSession(id);
    const fs = require('fs');
    const path = require('path');
    const authDir = path.join(process.cwd(), 'whatsapp-auth', id);
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
    return this.prisma.whatsappSession.delete({ where: { id } });
  }

  async updateSessionConfig(id: string, configData: any) {
    const session = await this.prisma.whatsappSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');

    const currentMetadata = (session.metadata as any) || {};
    const updatedMetadata = { ...currentMetadata, ...configData };

    if (configData.googleSheetUrl && configData.googleSheetUrl !== currentMetadata.googleSheetUrl) {
      this.googleSheets.clearCache(configData.googleSheetUrl);
    } else if (configData.googleSheetUrl) {
      this.googleSheets.clearCache(configData.googleSheetUrl);
    }

    return this.prisma.whatsappSession.update({
      where: { id },
      data: { metadata: updatedMetadata },
    });
  }

  async getConversations(query: ConversationFilterDto) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.hasUnread) where.unreadCount = { gt: 0 };
    if (query.tags) {
      const tagsArray = query.tags.split(',');
      where.tags = { hasSome: tagsArray };
    }

    return this.prisma.conversation.findMany({
      where,
      include: { assignedTo: true, _count: { select: { messages: true } } },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getConversation(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: { assignedTo: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async getMessages(id: string) {
    return this.prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { session: true },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.session) throw new BadRequestException('No session attached');

    const result = await this.sessionManager.sendMessage(
      conversation.session.id,
      dto.to,
      {
        text: dto.type === MessageType.TEXT ? dto.body : undefined,
        image: dto.type === MessageType.IMAGE ? { url: dto.mediaUrl! } as any : undefined,
        document: dto.type === MessageType.DOCUMENT ? { url: dto.mediaUrl! } as any : undefined,
        fileName: dto.fileName,
      }
    );

    // Save message to DB
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        whatsappId: (result as any)?.key?.id,
        body: dto.body,
        type: dto.type as any,
        direction: 'OUTBOUND',
        status: 'SENT',
        mediaUrl: dto.mediaUrl,
      } as any,
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), lastMessageText: dto.body },
    });

    this.eventEmitter.emit('whatsapp.message.sent', { message, conversation });

    return message;
  }

  async updateConversation(id: string, dto: UpdateConversationDto) {
    return this.prisma.conversation.update({
      where: { id },
      data: {
        status: dto.status,
        tags: dto.tags,
        labels: dto.labels,
        assignedToId: dto.assignedToId,
        notes: dto.notes,
        funnelStage: dto.funnelStage,
      } as any,
    });
  }

  async getCopilotData(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        clientId: true,
        name: true,
        phoneNumber: true,
        funnelStage: true,
        aiSummary: true,
        sentimentScore: true,
        metadata: true,
        lastAiAnalysisAt: true,
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const meta = (conversation.metadata as any) || {};
    const copilot = meta.copilot || {};
    const clientData = meta.clientData || {};

    let recentDocuments: any[] = [];
    if (conversation.clientId) {
      recentDocuments = await this.prisma.document.findMany({
        where: { clientId: conversation.clientId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          originalName: true,
          mimeType: true,
          url: true,
          metadata: true,
          createdAt: true,
        }
      });
    }

    return {
      conversationId: conversation.id,
      contactName: conversation.name,
      phone: conversation.phoneNumber,
      funnelStage: conversation.funnelStage,
      aiSummary: copilot.resumen || conversation.aiSummary || null,
      sentimentScore: conversation.sentimentScore,
      sentiment: copilot.sentimiento || null,
      priority: copilot.prioridad || null,
      clientData,
      missingData: copilot.datosFaltantes || [],
      suggestedActions: copilot.accionesSugeridas || [],
      lastAnalyzedAt: meta.lastCopilotAt || conversation.lastAiAnalysisAt,
      documents: recentDocuments,
    };
  }

  async getTemplates() {
    return this.prisma.whatsappTemplate.findMany();
  }

  async createTemplate(dto: CreateTemplateDto) {
    return this.prisma.whatsappTemplate.create({
      data: {
        name: dto.name,
        category: dto.category,
        content: (dto as any).content || JSON.stringify(dto.components),
      } as any,
    });
  }

  /**
   * Get the full CRM client profile linked to a conversation.
   * Returns client data, associated leads, all conversations, and recent activities.
   */
  async getClientProfile(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        clientId: true,
        leadId: true,
        phoneNumber: true,
        name: true,
        funnelStage: true,
        metadata: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // If no client linked yet, return extracted data from metadata
    if (!conversation.clientId) {
      const meta = (conversation.metadata as any) || {};
      return {
        linked: false,
        conversationId: conversation.id,
        contactName: conversation.name,
        phone: conversation.phoneNumber,
        funnelStage: conversation.funnelStage,
        extractedData: meta.clientData || {},
        client: null,
        leads: [],
        conversations: [],
      };
    }

    // Fetch full client profile with relations
    const client = await this.prisma.client.findUnique({
      where: { id: conversation.clientId },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            funnelStage: true,
            lastMessageAt: true,
            lastMessageText: true,
            status: true,
            unreadCount: true,
          },
        },
        credits: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            requestNumber: true,
            type: true,
            status: true,
            requestedAmount: true,
            approvedAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      return {
        linked: false,
        conversationId: conversation.id,
        contactName: conversation.name,
        phone: conversation.phoneNumber,
        funnelStage: conversation.funnelStage,
        extractedData: ((conversation.metadata as any) || {}).clientData || {},
        client: null,
        leads: [],
        conversations: [],
      };
    }

    return {
      linked: true,
      conversationId: conversation.id,
      funnelStage: conversation.funnelStage,
      client: {
        id: client.id,
        documentType: client.documentType,
        documentNumber: client.documentNumber,
        firstName: client.firstName,
        lastName: client.lastName,
        businessName: client.businessName,
        email: client.email,
        phone: client.phone,
        phone2: client.phone2,
        address: client.address,
        city: client.city,
        department: client.department,
        occupation: client.occupation,
        monthlyIncome: client.monthlyIncome,
        tags: client.tags,
        notes: client.notes,
        isActive: client.isActive,
        metadata: client.metadata,
        createdAt: client.createdAt,
      },
      leads: client.leads,
      conversations: client.conversations,
      credits: client.credits,
    };
  }
}
