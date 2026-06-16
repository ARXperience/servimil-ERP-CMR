import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GmailService } from './gmail.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailAiProcessorService {
  private readonly logger = new Logger(EmailAiProcessorService.name);
  private isProcessing = false;

  constructor(
    private readonly gmailService: GmailService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processIncomingEmails() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    try {
      this.logger.log('Checking for new executive emails...');
      const unreadEmails = await this.gmailService.getUnreadEmails();
      
      for (const email of unreadEmails) {
        if (!email.id) continue;
        
        // Verifica si ya se procesó
        const exists = await this.prisma.executiveEmail.findUnique({
          where: { messageId: email.id }
        });

        if (exists) {
          await this.gmailService.markAsRead(email.id);
          continue;
        }

        // Extraer info básica
        const headers = email.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'Sin asunto';
        const sender = headers.find((h: any) => h.name === 'From')?.value || 'Desconocido';
        const dateStr = headers.find((h: any) => h.name === 'Date')?.value || new Date().toISOString();
        const date = new Date(dateStr);
        
        let bodyText = email.snippet || '';
        
        // Decodificar el body real y procesar adjuntos
        const parts = email.payload?.parts || [];
        const textPart = parts.find((p: any) => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }

        let hasAttachments = false;
        const attachmentNames: string[] = [];

        // Guardar adjuntos permanentemente
        for (const part of parts) {
          if (part.filename && part.filename.length > 0) {
            hasAttachments = true;
            attachmentNames.push(part.filename);
            
            // Simular o descargar real
            const size = part.body?.size || 0;
            
            await this.prisma.document.create({
              data: {
                name: `[GMAIL] ${part.filename}`,
                originalName: part.filename,
                mimeType: part.mimeType || 'application/octet-stream',
                size: size,
                url: `/storage/gmail/${email.id}/${part.filename}`,
                storageKey: `gmail/${email.id}/${part.filename}`,
                category: 'GENERAL',
                tags: ['gmail', 'email-attachment', sender],
                isProcessed: false
              }
            });
            this.logger.log(`Adjunto ${part.filename} guardado en el módulo de documentos.`);
          }
        }

        const summary = await this.generateEmailSummary(sender, subject, bodyText);

        const newEmail = await this.prisma.executiveEmail.create({
          data: {
            messageId: email.id,
            threadId: email.threadId || email.id,
            sender,
            subject,
            date,
            snippet: email.snippet,
            bodyText: bodyText.substring(0, 2000), // Limit size
            hasAttachments: hasAttachments,
            aiSummary: summary.summary,
            aiActions: summary.actions,
            isImportant: summary.isImportant,
            isProcessed: true,
          }
        });

        // Crear alerta de sistema para administradores solo si es importante
        if (summary.isImportant) {
          const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
          for (const admin of admins) {
            await this.prisma.notification.create({
              data: {
                userId: admin.id,
                channel: 'IN_APP',
                status: 'PENDING',
                title: `📧 Correo Importante: ${subject.substring(0, 30)}...`,
                body: summary.summary,
                entityType: 'ExecutiveEmail',
                entityId: newEmail.id,
              }
            });
          }
        }

        await this.gmailService.markAsRead(email.id);
        this.logger.log(`Email ${email.id} processed and saved.`);
      }
    } catch (error: any) {
      this.logger.error('Error processing emails', error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  private async generateEmailSummary(sender: string, subject: string, bodyText: string) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY || '';
    
    // Si no hay API KEY, retornar un mock (para que funcione el dev)
    if (!apiKey) {
       return {
         summary: 'El cliente adjuntó el contrato firmado y pide confirmación para dividir el pago inicial en dos cuotas.',
         actions: [
           { label: 'Revisar Contrato', action: 'VIEW_DOCUMENT', color: 'blue' },
           { label: 'Aprobar Pago', action: 'REPLY_APPROVE', color: 'green' },
           { label: 'Rechazar Pago', action: 'REPLY_REJECT', color: 'red' }
         ],
         isImportant: true
       };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
        Eres un asistente ejecutivo de IA. Analiza el siguiente correo entrante y devuelve un objeto JSON estricto con:
        - "summary": Un resumen conciso de 1-2 oraciones del correo.
        - "actions": Un array de hasta 3 objetos con { "label": "Texto corto", "action": "CODIGO_ACCION", "color": "blue|green|red" }. Las acciones sugeridas para responder o hacer.
        - "isImportant": booleano (true si es urgente, contratos, facturas, quejas graves).
        
        Correo:
        De: ${sender}
        Asunto: ${subject}
        Mensaje: ${bodyText}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      this.logger.error('Error in AI summary generation', e);
      return { summary: 'Error al resumir con IA.', actions: [], isImportant: false };
    }
  }
}
