import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappSessionManager } from './whatsapp-session.manager';
import { GoogleSheetsService } from './google-sheets.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WhatsappCrmSyncService } from './whatsapp-crm-sync.service';

@Injectable()
export class WhatsappAiService {
  private readonly logger = new Logger(WhatsappAiService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionManager: WhatsappSessionManager,
    private readonly googleSheets: GoogleSheetsService,
    private readonly crmSync: WhatsappCrmSyncService,
  ) {
    this.initGemini();
  }

  private async initGemini() {
    try {
      // Try loading from SystemConfig first, fallback to env
      const configRow = await this.prisma.systemConfig.findUnique({
        where: { key: 'gemini_api_key' },
      }).catch(() => null);

      const apiKey = (configRow?.value as any)?.key
        || process.env.GEMINI_API_KEY
        || 'AIzaSyAA5HDZNTgpg_LZhu1UnuBsOm4sAAC_pT0';

      if (apiKey) {
        this.logger.log(`Using Gemini API Key starting with: ${apiKey.substring(0, 5)}...`);
        this.genAI = new GoogleGenerativeAI(apiKey.trim());
        this.logger.log('Gemini AI initialized successfully');
      }
    } catch (error) {
      this.logger.warn('Could not initialize Gemini AI', error);
    }
  }

  private async getSessionMetadata(sessionId: string) {
    const session = await this.prisma.whatsappSession.findUnique({
      where: { id: sessionId },
      select: { metadata: true }
    });
    return (session?.metadata as any) || {};
  }

  private async isBotEnabled(sessionId: string): Promise<boolean> {
    try {
      const meta = await this.getSessionMetadata(sessionId);
      return meta.isBotEnabled === true;
    } catch {
      return false;
    }
  }

  private async callGeminiWithRetry(model: any, args: any, maxRetries = 3): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await model.generateContent(args);
      } catch (error: any) {
        if (error.message?.includes('503') && attempt < maxRetries) {
          this.logger.warn(`Gemini 503 error, retrying attempt ${attempt}/${maxRetries} in ${2000 * attempt}ms...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        } else {
          throw error;
        }
      }
    }
  }

  private async getSystemPrompt(sessionId: string): Promise<string> {
    try {
      const meta = await this.getSessionMetadata(sessionId);
      return meta.botPrompt || this.getDefaultPrompt();
    } catch {
      return this.getDefaultPrompt();
    }
  }

  private async getKnowledgeBase(sessionId: string): Promise<string> {
    try {
      const meta = await this.getSessionMetadata(sessionId);
      return meta.knowledgeBase || '';
    } catch {
      return '';
    }
  }

  private async getGoogleSheetUrl(sessionId: string): Promise<string> {
    try {
      const meta = await this.getSessionMetadata(sessionId);
      return meta.googleSheetUrl || '';
    } catch {
      return '';
    }
  }

  private getDefaultPrompt(): string {
    return `Eres un asistente de servicio al cliente útil para SERVIMIL, una empresa de servicios financieros.
Ayudas a los clientes con consultas sobre sus préstamos, pagos, casos legales y preguntas generales.
Sé siempre profesional, amable y conciso. Responde en el mismo idioma que usa el cliente (generalmente español).
Si no sabes algo, sugiere al cliente que se comunique con un asesor humano.
Mantén las respuestas en menos de 200 palabras.`;
  }

  @OnEvent('whatsapp.audio.received')
  async handleAudioReceived(payload: { buffer: Buffer; messageId: string; conversation: any }) {
    try {
      const { buffer, messageId, conversation } = payload;
      
      const botEnabled = await this.isBotEnabled(conversation.sessionId);
      if (!botEnabled) return;

      if (!this.genAI) {
        await this.initGemini();
        if (!this.genAI) return;
      }

      this.logger.log(`[${conversation.id}] Transcribing audio message...`);

      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // Inline audio for Gemini
      const audioPart = {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "audio/ogg" 
        }
      };

      const result = await this.callGeminiWithRetry(model, [
        "Por favor transcribe el siguiente audio a texto. Solo devuelve la transcripción literal, sin comillas ni aclaraciones extras.",
        audioPart
      ]);
      
      const transcription = result.response.text().trim();
      if (!transcription) return;

      this.logger.log(`[${conversation.id}] Audio transcribed: ${transcription}`);

      // Update message with transcription
      const updatedMessage = await this.prisma.message.update({
        where: { id: messageId },
        data: {
          body: `🎵 Audio: ${transcription}`,
        }
      });

      // Update conversation last message text
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageText: `🎵 Audio: ${transcription}`,
        }
      });

      // Pass it to the standard handleIncomingMessage flow
      await this.handleIncomingMessage({
        message: updatedMessage,
        conversation
      });

    } catch (error) {
      this.logger.error('Error transcribing audio with Gemini', error);
    }
  }

  @OnEvent('whatsapp.document.received')
  async handleDocumentReceived(payload: { buffer: Buffer; mimeType: string; document: any; messageId: string; conversation: any }) {
    try {
      const { buffer, mimeType, document, messageId, conversation } = payload;
      
      if (!this.genAI) {
        await this.initGemini();
        if (!this.genAI) return;
      }

      this.logger.log(`[${conversation.id}] Analyzing document/image with Gemini...`);

      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const filePart = {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: mimeType || "image/jpeg" 
        }
      };

      const prompt = `Eres un asistente experto en lectura de documentos y CRM. Analiza el siguiente documento o imagen enviada por un cliente. 
Extrae los datos clave y genera un resumen ejecutivo MUY conciso y estructurado (con viñetas si es necesario) para el asesor de ventas.`;

      const startTime = Date.now();
      const result = await this.callGeminiWithRetry(model, [prompt, filePart]);
      const processingTime = Date.now() - startTime;
      const tokensUsed = result.response.usageMetadata?.totalTokenCount || 0;
      
      const summary = result.response.text().trim();
      if (!summary) return;

      this.logger.log(`[${conversation.id}] Document analyzed: ${summary.substring(0, 50)}...`);

      // Update Document with AI summary
      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          metadata: { aiSummary: summary },
          isProcessed: true,
        }
      });

      // Log AI Usage
      await this.prisma.aiAnalysis.create({
        data: {
          provider: 'GEMINI',
          model: 'gemini-2.5-flash',
          type: 'ocr_summary',
          entityType: 'document',
          entityId: document.id,
          prompt: prompt.substring(0, 500),
          result: { summary },
          tokensUsed,
          processingTime,
        },
      });

      // Update message with summary so the CRM user sees it
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          body: `📄 [Documento/Imagen Analizado por IA]\n${summary}`,
        }
      });

      // Trigger copilot analysis so the overall conversation summary updates
      this.triggerCopilotAnalysis(conversation.id, conversation.sessionId).catch(err => 
        this.logger.error(`Error in background analysis for ${conversation.id}`, err)
      );

    } catch (error) {
      this.logger.error('Error analyzing document with Gemini', error);
    }
  }

  @OnEvent('whatsapp.message.sent')
  async handleOutgoingMessage(payload: { message: any; conversation: any }) {
    try {
      const { conversation } = payload;
      this.logger.log(`[${conversation.id}] Outgoing message sent, triggering background analysis...`);
      this.triggerCopilotAnalysis(conversation.id, conversation.sessionId).catch(err => 
        this.logger.error(`Error in background analysis for ${conversation.id}`, err)
      );
    } catch (error) {
      this.logger.error('Error in handleOutgoingMessage', error);
    }
  }

  private async triggerCopilotAnalysis(conversationId: string, sessionId: string) {
    try {
      await this.analyzeFunnelStage(conversationId, sessionId);
      await this.generateCopilotSummary(conversationId, sessionId);
    } catch (error) {
      this.logger.error(`Error in triggerCopilotAnalysis for ${conversationId}`, error);
    }
  }

  @OnEvent('whatsapp.message.received')
  async handleIncomingMessage(payload: { message: any; conversation: any }) {
    try {
      const { message, conversation } = payload;
      const sessionId = conversation.sessionId;

      const incomingText = message.body;

      // Skip non-text messages or temporary placeholders for media (which will be processed later)
      if (!incomingText || incomingText.trim().length === 0) return;
      if (['🎵 Mensaje de voz', '📷 Imagen', '📄 Documento', '🎥 Video'].includes(incomingText)) {
        return;
      }

      // ─── 1. SIEMPRE LANZAR ANÁLISIS DE COPILOTO Y CRM EN SEGUNDO PLANO ───
      this.logger.log(`[${conversation.id}] Incoming message received, triggering background analysis...`);
      this.triggerCopilotAnalysis(conversation.id, sessionId).catch(err => 
        this.logger.error(`Error in background analysis for ${conversation.id}`, err)
      );

      // ─── 2. EVALUAR SI EL BOT DEBE RESPONDER AUTOMÁTICAMENTE ───
      const botEnabled = await this.isBotEnabled(sessionId);
      if (!botEnabled) {
        this.logger.debug(`[${sessionId}] WhatsApp AI Bot is disabled. Analysis running but no auto-reply.`);
        return;
      }

      if (!this.genAI) {
        await this.initGemini();
        if (!this.genAI) {
          this.logger.warn('Gemini AI not available, skipping auto-reply');
          return;
        }
      }

      // Get recent conversation history for context
      const recentMessages = await this.prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const systemPrompt = await this.getSystemPrompt(sessionId);
      const knowledgeBase = await this.getKnowledgeBase(sessionId);
      const googleSheetUrl = await this.getGoogleSheetUrl(sessionId);

      this.logger.log(`[${sessionId}] Retrieved system prompt and knowledge base`);

      // Build conversation history for Gemini
      const historyForAI = recentMessages
        .reverse()
        .map((m) => {
          let cleanBody = m.body || '';
          cleanBody = cleanBody.replace(/^🎵 Audio: /i, '');
          cleanBody = cleanBody.replace(/^📄 \[Documento\/Imagen Analizado por IA\]\n/i, '');
          return `${m.direction === 'INBOUND' ? 'Customer' : 'Assistant'}: ${cleanBody}`;
        })
        .join('\n');

      let fullPrompt = `${systemPrompt}\n`;
      if (knowledgeBase) {
        fullPrompt += `\n--- BASE DE CONOCIMIENTO (Usa esta información para responder) ---\n${knowledgeBase}\n------------------------------------------------------------\n`;
      }

      // Inject Google Sheets data if configured
      if (googleSheetUrl) {
        const currentMeta = (conversation.metadata as any) || {};
        const clientData = currentMeta.clientData || {};
        const searchTerms = [
          conversation.phoneNumber,
          conversation.remoteJid?.replace(/@.*/, ''),
          clientData.cedula,
          clientData.correo
        ].filter(Boolean) as string[];
        const sheetsContext = await this.googleSheets.getSheetContextForPrompt(googleSheetUrl, searchTerms);
        if (sheetsContext) {
          fullPrompt += sheetsContext;
        }
      }

      let cleanIncomingText = incomingText;
      cleanIncomingText = cleanIncomingText.replace(/^🎵 Audio: /i, '');
      cleanIncomingText = cleanIncomingText.replace(/^📄 \[Documento\/Imagen Analizado por IA\]\n/i, '');

      fullPrompt += `\nConversation history:\n${historyForAI}\n\nCustomer: ${cleanIncomingText}\nAssistant:`;

      this.logger.log(`[${sessionId}] Sending request to Gemini...`);
      const startTime = Date.now();
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await this.callGeminiWithRetry(model, fullPrompt);
      const processingTime = Date.now() - startTime;
      this.logger.log(`[${sessionId}] Received response from Gemini`);
      
      const response = result.response;
      let aiReply = response.text();
      const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

      if (!aiReply || aiReply.trim().length === 0) {
        return;
      }

      this.logger.log(`[${sessionId}] AI Reply: ${aiReply.substring(0, 50)}...`);

      // Send the AI reply via WhatsApp
      await this.sessionManager.sendMessage(
        conversation.sessionId,
        conversation.remoteJid,
        { text: aiReply },
      );

      // Save the AI reply as an outbound message
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          body: aiReply,
          type: 'TEXT' as any,
          direction: 'OUTBOUND',
          status: 'SENT',
        } as any,
      });

      // Update conversation
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          lastMessageText: aiReply,
        },
      });

      // Log the AI analysis
      await this.prisma.aiAnalysis.create({
        data: {
          provider: 'GEMINI',
          model: 'gemini-2.5-flash',
          type: 'suggestion',
          entityType: 'conversation',
          entityId: conversation.id,
          prompt: fullPrompt.substring(0, 500),
          result: { reply: aiReply },
          tokensUsed,
          processingTime,
        },
      });

      this.logger.log(`AI auto-replied to conversation ${conversation.id}`);

    } catch (error) {
      this.logger.error('Error in WhatsApp AI auto-reply', error);
    }
  }

  /**
   * Generate a summary and suggested actions for the advisor (Copilot).
   */
  async generateCopilotSummary(conversationId: string, sessionId: string) {
    if (!this.genAI) return;

    const recentMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    if (recentMessages.length < 2) return;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { metadata: true, funnelStage: true, phoneNumber: true, remoteJid: true },
    });

    const currentMeta = (conversation?.metadata as any) || {};
    const clientData = currentMeta.clientData || {};
    const clientDataStr = Object.entries(clientData)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n') || 'No hay datos registrados aún.';

    let sheetsContext = '';
    if (sessionId) {
      const sheetUrl = await this.getGoogleSheetUrl(sessionId);
      if (sheetUrl) {
        const searchTerms = [
          conversation?.phoneNumber,
          conversation?.remoteJid?.replace(/@.*/, ''),
          clientData?.cedula,
          clientData?.correo
        ].filter(Boolean) as string[];
        sheetsContext = await this.googleSheets.getSheetContextForPrompt(sheetUrl, searchTerms);
      }
    }

    const historyForAI = recentMessages
      .reverse()
      .map((m) => `${m.direction === 'INBOUND' ? 'Cliente' : 'Bot/Asesor'}: ${m.body || ''}`)
      .join('\n');

    const prompt = `Eres el copiloto IA de un asesor comercial de SERVIMIL (servicios financieros).
Analiza esta conversación y genera un reporte breve para el asesor.

Datos del cliente recopilados hasta ahora:
${clientDataStr}

${sheetsContext}

Etapa actual en el embudo: ${conversation?.funnelStage || 'NUEVO'}

Historial reciente:
${historyForAI}

INSTRUCCIÓN EXTRA: Extrae cualquier dato personal nuevo o actualizado del cliente mencionado en la conversación (ej. nombre, cédula, teléfono, correo, ciudad, dirección, ocupación, ingresos, monto_solicitado, servicio_solicitado, tipo_documento, es_cliente_existente). Combina estos datos con los que ya teníamos y devuélvelos en el campo "datosRecopilados".
Asegúrate de formatear "tipo_documento" como CC/NIT/CE/TI y "es_cliente_existente" como si/no.

Genera tu respuesta en JSON estricto con esta estructura:
{
  "resumen": "Resumen de 2-3 oraciones sobre qué quiere el cliente y el estado de la solicitud.",
  "datosRecopilados": { "nombre": "...", "cedula": "...", "correo": "..." },
  "datosFaltantes": ["lista de datos que aún no se han recopilado y que serían útiles"],
  "accionesSugeridas": ["lista de 2-4 acciones concretas que el asesor debería tomar"],
  "prioridad": "alta|media|baja",
  "sentimiento": "positivo|neutral|negativo"
}

Responde SOLO con el JSON, sin marcadores de bloque de código ni texto adicional.`;

    const startTime = Date.now();
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await this.callGeminiWithRetry(model, prompt);
    const processingTime = Date.now() - startTime;
    const tokensUsed = result.response.usageMetadata?.totalTokenCount || 0;
    
    let copilotText = result.response.text().trim();
    
    // Strip markdown code block markers if present
    copilotText = copilotText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    try {
      const copilotData = JSON.parse(copilotText);
      const newClientData = copilotData.datosRecopilados || clientData;

      // Save the copilot data into conversation metadata
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          aiSummary: copilotData.resumen,
          sentimentScore: copilotData.sentimiento === 'positivo' ? 1 : copilotData.sentimiento === 'negativo' ? -1 : 0,
          metadata: {
            ...currentMeta,
            clientData: newClientData,
            copilot: copilotData,
            lastCopilotAt: new Date().toISOString(),
            lastDataExtractedAt: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`[${sessionId}] Copilot summary generated and client data extracted for ${conversationId}`);

      // ── CRM SYNC: Update CRM Client and Lead with the newly extracted data ──
      this.crmSync.syncClientFromConversation(conversationId).catch(err =>
        this.logger.error(`[${conversationId}] CRM client sync error`, err)
      );

      if (conversation?.funnelStage) {
        this.crmSync.syncLeadFromConversation(conversationId, conversation.funnelStage).catch(err =>
          this.logger.error(`[${conversationId}] CRM lead sync error`, err)
        );
      }

      // Enrich from Google Sheets if available
      if (sessionId) {
        const sheetUrl = await this.getGoogleSheetUrl(sessionId);
        if (sheetUrl) {
          this.crmSync.enrichClientFromSheets(conversationId, sheetUrl).catch(err =>
            this.logger.error(`[${conversationId}] Google Sheets enrichment error`, err)
          );
        }
      }

      await this.prisma.aiAnalysis.create({
        data: {
          provider: 'GEMINI',
          model: 'gemini-2.5-flash',
          type: 'summary',
          entityType: 'conversation',
          entityId: conversationId,
          prompt: prompt.substring(0, 500),
          result: { summary: copilotData.resumen },
          tokensUsed,
          processingTime,
        },
      });

    } catch (err) {
      this.logger.warn(`Could not parse copilot JSON for ${conversationId}`, err);
    }
  }

  async analyzeFunnelStage(conversationId: string, sessionId: string) {
    if (!this.genAI) return;
    
    // Get recent messages
    const recentMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    if (recentMessages.length < 3) {
      return; // Not enough context yet
    }

    const historyForAI = recentMessages
      .reverse()
      .map((m) => `${m.direction === 'INBOUND' ? 'Cliente' : 'Asesor/Bot'}: ${m.body || ''}`)
      .join('\n');

    const prompt = `Analiza el siguiente historial de chat de WhatsApp de una empresa de servicios financieros y determina en qué etapa del embudo de ventas se encuentra el cliente.

Las etapas posibles son estrictamente:
- NUEVO: Primer contacto, pidiendo información básica.
- INTERESADO: Ha hecho preguntas específicas, muestra interés real.
- NEGOCIANDO: Preguntando por precios, métodos de pago, o requisitos finales.
- CLIENTE: Ya compró o está en proceso de confirmar el pago/servicio.
- SOPORTE: El cliente ya tiene el servicio y está pidiendo ayuda o soporte técnico.
- DESCARTADO: El cliente dijo que no le interesa, dejó de responder o no califica.

Historial:
${historyForAI}

Reglas: Responde ÚNICAMENTE con el nombre exacto de la etapa en MAYÚSCULAS y nada más.`;

    const startTime = Date.now();
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await this.callGeminiWithRetry(model, prompt);
    const processingTime = Date.now() - startTime;
    const tokensUsed = result.response.usageMetadata?.totalTokenCount || 0;
    const stage = result.response.text().trim().toUpperCase();

    const validStages = ['NUEVO', 'INTERESADO', 'NEGOCIANDO', 'CLIENTE', 'SOPORTE', 'DESCARTADO'];
    
    // Find if the output contains any of the valid stages
    const matchedStage = validStages.find(s => stage.includes(s));
    
    if (matchedStage) {
      this.logger.log(`[${sessionId}] Conversation ${conversationId} classified as: ${matchedStage}`);
      
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          funnelStage: matchedStage,
          lastAiAnalysisAt: new Date(),
        },
      });

      // ── CRM SYNC: Create/update Lead record based on funnel stage ──
      this.crmSync.syncLeadFromConversation(conversationId, matchedStage).catch(err =>
        this.logger.error(`[${conversationId}] CRM lead sync error`, err)
      );
      
      await this.prisma.aiAnalysis.create({
        data: {
          provider: 'GEMINI',
          model: 'gemini-2.5-flash',
          type: 'classification',
          entityType: 'conversation',
          entityId: conversationId,
          prompt: prompt.substring(0, 500),
          result: { classification: matchedStage },
          tokensUsed,
          processingTime,
        },
      });
    }
  }
}
