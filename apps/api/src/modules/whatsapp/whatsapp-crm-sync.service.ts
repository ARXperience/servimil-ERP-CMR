import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleSheetsService } from './google-sheets.service';

/**
 * WhatsappCrmSyncService
 *
 * Bridges the WhatsApp AI bot with the CRM system.
 * When the bot extracts client data from conversations,
 * this service creates/updates Client and Lead records
 * so advisors can review everything in the CRM.
 */
@Injectable()
export class WhatsappCrmSyncService {
  private readonly logger = new Logger(WhatsappCrmSyncService.name);

  // Map WhatsApp funnel stages to CRM Lead statuses
  private readonly FUNNEL_TO_LEAD_STATUS: Record<string, string> = {
    'NUEVO': 'NEW',
    'INTERESADO': 'CONTACTED',
    'NEGOCIANDO': 'NEGOTIATION',
    'CLIENTE': 'WON',
    'SOPORTE': 'WON',
    'DESCARTADO': 'LOST',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleSheets: GoogleSheetsService,
  ) {}

  /**
   * Sync client data from a conversation into the CRM Client table.
   * Creates a new Client if not found, or updates existing one.
   * Links the Conversation to the Client.
   */
  async syncClientFromConversation(conversationId: string): Promise<void> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: {
          id: true,
          clientId: true,
          phoneNumber: true,
          remoteJid: true,
          name: true,
          sessionId: true,
          metadata: true,
        },
      });

      if (!conversation) {
        this.logger.warn(`Conversation ${conversationId} not found for CRM sync`);
        return;
      }

      const meta = (conversation.metadata as any) || {};
      const clientData = meta.clientData || {};

      // Need at least a name or cedula to create a client
      const hasIdentifyingData = clientData.nombre || clientData.cedula || conversation.phoneNumber;
      if (!hasIdentifyingData) {
        this.logger.debug(`[${conversationId}] Not enough client data to sync to CRM yet`);
        return;
      }

      // Try to find existing client
      let existingClient = null;

      // 1. If conversation already linked to a client
      if (conversation.clientId) {
        existingClient = await this.prisma.client.findUnique({
          where: { id: conversation.clientId },
        });
      }

      // 2. Search by cedula (document number)
      if (!existingClient && clientData.cedula) {
        existingClient = await this.prisma.client.findFirst({
          where: { documentNumber: clientData.cedula.replace(/\D/g, '') },
        });
      }

      // 3. Search by phone number
      if (!existingClient && conversation.phoneNumber) {
        const phone = conversation.phoneNumber.replace(/\D/g, '');
        existingClient = await this.prisma.client.findFirst({
          where: {
            OR: [
              { phone: { contains: phone.slice(-10) } },
              { phone2: { contains: phone.slice(-10) } },
            ],
          },
        });
      }

      // Build update/create data from extracted client info
      const clientUpdateData = this.buildClientData(clientData, conversation);

      if (existingClient) {
        // Update existing client with new data (don't overwrite with empty values)
        const updatePayload: any = {};
        for (const [key, value] of Object.entries(clientUpdateData)) {
          if (value && String(value).trim().length > 0) {
            // Don't overwrite documentNumber if already set
            if (key === 'documentNumber' && existingClient.documentNumber) continue;
            updatePayload[key] = value;
          }
        }

        if (Object.keys(updatePayload).length > 0) {
          await this.prisma.client.update({
            where: { id: existingClient.id },
            data: updatePayload,
          });
          this.logger.log(`[${conversationId}] Updated existing CRM client ${existingClient.id}`);
        }

        // Link conversation to client if not already linked
        if (!conversation.clientId || conversation.clientId !== existingClient.id) {
          await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { clientId: existingClient.id },
          });
          this.logger.log(`[${conversationId}] Linked conversation to existing client ${existingClient.id}`);
        }
      } else {
        // Create new client
        const newClient = await this.prisma.client.create({
          data: {
            documentType: clientData.tipo_documento || 'CC',
            documentNumber: clientData.cedula?.replace(/\D/g, '') || `WA-${conversation.phoneNumber || Date.now()}`,
            firstName: this.extractFirstName(clientData.nombre || conversation.name),
            lastName: this.extractLastName(clientData.nombre || conversation.name),
            email: clientData.correo || null,
            phone: conversation.phoneNumber || clientData.telefono || null,
            address: clientData.direccion || null,
            city: clientData.ciudad || null,
            occupation: clientData.ocupacion || null,
            monthlyIncome: clientData.ingresos ? parseFloat(clientData.ingresos.replace(/\D/g, '')) || null : null,
            tags: ['whatsapp', 'bot-registered'],
            notes: `Cliente registrado automáticamente desde WhatsApp.\nFuente: Conversación con bot IA.`,
            metadata: {
              source: 'whatsapp_bot',
              conversationId: conversationId,
              originalData: clientData,
              registeredAt: new Date().toISOString(),
            },
          } as any,
        });

        // Link conversation to new client
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { clientId: newClient.id },
        });

        this.logger.log(`[${conversationId}] Created new CRM client ${newClient.id} and linked to conversation`);
      }
    } catch (error) {
      this.logger.error(`Error syncing client for conversation ${conversationId}`, error);
    }
  }

  /**
   * Sync lead from a conversation into the CRM Lead table.
   * Creates a new Lead if the conversation doesn't have one,
   * or updates the existing Lead's status.
   */
  async syncLeadFromConversation(conversationId: string, funnelStage: string): Promise<void> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: {
          id: true,
          clientId: true,
          leadId: true,
          phoneNumber: true,
          name: true,
          sessionId: true,
          funnelStage: true,
          aiSummary: true,
          metadata: true,
        },
      });

      if (!conversation) return;

      const meta = (conversation.metadata as any) || {};
      const clientData = meta.clientData || {};
      const copilot = meta.copilot || {};
      const leadStatus = this.FUNNEL_TO_LEAD_STATUS[funnelStage] || 'NEW';

      // Extract what the client is interested in
      const interest = clientData.servicio_solicitado
        || copilot.resumen?.substring(0, 200)
        || conversation.aiSummary?.substring(0, 200)
        || 'Consulta via WhatsApp';

      const estimatedValue = clientData.monto_solicitado
        ? parseFloat(String(clientData.monto_solicitado).replace(/\D/g, '')) || null
        : null;

      if (conversation.leadId) {
        // Update existing lead
        const updateData: any = {
          status: leadStatus,
          interest,
          sentimentScore: copilot.sentimiento === 'positivo' ? 1 : copilot.sentimiento === 'negativo' ? -1 : 0,
        };

        if (estimatedValue) {
          updateData.estimatedValue = estimatedValue;
        }

        // Link to client if we now have one
        if (conversation.clientId && !conversation.leadId) {
          updateData.clientId = conversation.clientId;
        }

        await this.prisma.lead.update({
          where: { id: conversation.leadId },
          data: updateData,
        });

        this.logger.log(`[${conversationId}] Updated CRM lead ${conversation.leadId} → status: ${leadStatus}`);
      } else {
        // Create new lead
        const contactName = clientData.nombre || conversation.name || conversation.phoneNumber || 'Contacto WhatsApp';

        const newLead = await this.prisma.lead.create({
          data: {
            name: contactName,
            source: 'WHATSAPP',
            status: leadStatus,
            phone: conversation.phoneNumber || clientData.telefono || null,
            email: clientData.correo || null,
            interest,
            estimatedValue: estimatedValue || null,
            clientId: conversation.clientId || null,
            sentimentScore: copilot.sentimiento === 'positivo' ? 1 : copilot.sentimiento === 'negativo' ? -1 : 0,
            intentSignals: this.extractIntentSignals(copilot, clientData),
            tags: ['whatsapp', 'auto-generated'],
            notes: `Lead generado automáticamente desde conversación WhatsApp.\n${copilot.resumen || conversation.aiSummary || ''}`,
            metadata: {
              source: 'whatsapp_bot',
              conversationId: conversationId,
              funnelStage,
              clientData,
              copilotSummary: copilot.resumen || null,
              suggestedActions: copilot.accionesSugeridas || [],
              createdAt: new Date().toISOString(),
            },
          } as any,
        });

        // Link the lead to the conversation
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { leadId: newLead.id },
        });

        this.logger.log(`[${conversationId}] Created new CRM lead ${newLead.id} (${leadStatus}) and linked to conversation`);
      }
    } catch (error) {
      this.logger.error(`Error syncing lead for conversation ${conversationId}`, error);
    }
  }

  /**
   * Enrich existing client with data from Google Sheets if available.
   * Called when the bot finds a match in the sheet.
   */
  async enrichClientFromSheets(conversationId: string, sheetUrl: string): Promise<void> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true, clientId: true, phoneNumber: true, metadata: true },
      });

      if (!conversation?.clientId) return;

      const currentConvMeta = (conversation.metadata as any) || {};
      const clientData = currentConvMeta.clientData || {};

      const searchTerms = [
        conversation.phoneNumber,
        clientData.cedula,
        clientData.correo
      ].filter(Boolean) as string[];

      if (searchTerms.length === 0) return;

      const matches = await this.googleSheets.findByTerms(sheetUrl, searchTerms);
      if (!matches || matches.length === 0) return;

      const sheetRow = matches[0];

      // Store the raw sheet data in client metadata for reference
      const client = await this.prisma.client.findUnique({
        where: { id: conversation.clientId },
        select: { id: true, metadata: true, tags: true },
      });

      if (!client) return;

      const currentMeta = (client.metadata as any) || {};
      const currentTags = client.tags || [];

      await this.prisma.client.update({
        where: { id: client.id },
        data: {
          tags: currentTags.includes('cliente-existente')
            ? currentTags
            : [...currentTags, 'cliente-existente'],
          metadata: {
            ...currentMeta,
            googleSheetsData: sheetRow,
            sheetEnrichedAt: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`[${conversationId}] Enriched client ${client.id} with Google Sheets data`);
    } catch (error) {
      this.logger.error(`Error enriching client from sheets for ${conversationId}`, error);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────

  private buildClientData(clientData: Record<string, string>, conversation: any): Record<string, any> {
    const data: Record<string, any> = {};

    if (clientData.nombre) {
      data.firstName = this.extractFirstName(clientData.nombre);
      data.lastName = this.extractLastName(clientData.nombre);
    }
    if (clientData.cedula) data.documentNumber = clientData.cedula.replace(/\D/g, '');
    if (clientData.correo) data.email = clientData.correo;
    if (clientData.telefono) data.phone = clientData.telefono;
    if (clientData.ciudad) data.city = clientData.ciudad;
    if (clientData.direccion) data.address = clientData.direccion;
    if (clientData.ocupacion) data.occupation = clientData.ocupacion;
    if (clientData.departamento) data.department = clientData.departamento;
    if (clientData.ingresos) {
      const parsed = parseFloat(clientData.ingresos.replace(/\D/g, ''));
      if (!isNaN(parsed)) data.monthlyIncome = parsed;
    }

    return data;
  }

  private extractFirstName(fullName: string | null | undefined): string {
    if (!fullName) return 'Sin nombre';
    const parts = fullName.trim().split(/\s+/);
    return parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
  }

  private extractLastName(fullName: string | null | undefined): string {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return '';
    return parts.slice(Math.ceil(parts.length / 2)).join(' ');
  }

  private extractIntentSignals(copilot: any, clientData: Record<string, string>): string[] {
    const signals: string[] = [];

    if (clientData.servicio_solicitado) {
      signals.push(`Servicio: ${clientData.servicio_solicitado}`);
    }
    if (clientData.monto_solicitado) {
      signals.push(`Monto: ${clientData.monto_solicitado}`);
    }
    if (clientData.es_cliente_existente === 'si' || clientData.es_cliente_existente === 'sí') {
      signals.push('Cliente existente en base de datos');
    }
    if (copilot.prioridad) {
      signals.push(`Prioridad IA: ${copilot.prioridad}`);
    }

    return signals;
  }
}
