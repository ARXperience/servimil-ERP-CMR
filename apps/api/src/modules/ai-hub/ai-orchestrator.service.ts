import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiRouterService } from './ai-router.service';
import { AiToolsService } from './ai-tools.service';
import { AiPermissionsService } from './ai-permissions.service';
import { AiAssistantMode, AiExecutionStatus, AiRiskLevel } from '@prisma/client';

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly routerService: AiRouterService,
    private readonly toolsService: AiToolsService,
    private readonly permissionsService: AiPermissionsService,
  ) {}

  async handleUserMessage(userId: string, message: string, conversationId?: string, audioBase64?: string, mimeType?: string) {
    this.logger.log(`Handling message from ${userId}: ${message} (Audio: ${!!audioBase64})`);

    let conversation;
    if (conversationId) {
      conversation = await this.prisma.aiConversation.findUnique({ where: { id: conversationId } });
    }

    if (!conversation) {
      conversation = await this.prisma.aiConversation.create({
        data: {
          userId,
          assistantMode: AiAssistantMode.GENERAL,
          title: message.substring(0, 50) || 'Audio Message',
        },
      });
    }

    // Save user message
    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message || '[Voice Note]',
      },
    });

    // Get previous messages
    const history = await this.prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20, // last 20 messages context
    });

    // Format for Gemini
    const geminiHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Inject System Prompt
    geminiHistory.unshift({
      role: 'user',
      parts: [{ text: "You are the central AI Hub Assistant for SERVIMIL OS. You have a tool called query_database that gives you read access to ANY module in the Prisma database (clients, payroll, transactions, users, leads, etc.). Si te hacen preguntas sobre información del negocio, empleados, pagos o cualquier dato, USA LA HERRAMIENTA query_database para consultar la base de datos y extraer la información antes de responder.\n\nREGLAS CLAVE DE ESQUEMA Y HERRAMIENTAS:\n- Para buscar clientes/contactos por nombre, teléfono o cédula, prioriza SIEMPRE usar la herramienta 'search_contacts'.\n- Si usas query_database para clientes, el modelo es 'client' y el campo de cédula es 'documentNumber' (NO 'user' ni 'identificationNumber').\n- Si query_database falla por un campo incorrecto ('Unknown argument'), corrige el nombre del campo e intenta de nuevo." }]
    });

    const toolsDef = this.toolsService.getGeminiToolsDefinition();

    // Prepare current message parts
    const currentMessageParts: any[] = [];
    if (message) currentMessageParts.push({ text: message });
    if (audioBase64 && mimeType) {
      currentMessageParts.push({
        inlineData: {
          data: audioBase64.split(',')[1] || audioBase64,
          mimeType: mimeType,
        }
      });
    }
    if (currentMessageParts.length === 0) {
      currentMessageParts.push({ text: "Hello" });
    }

    // Call Gemini
    const result = await this.routerService.callGemini(currentMessageParts, toolsDef, geminiHistory.slice(0, -1));

    let finalReply = result.text;

    // Handle tool calls
    if (result.functionCalls && result.functionCalls.length > 0) {
      this.logger.log(`LLM requested ${result.functionCalls.length} tool calls`);
      
      const functionResponses = [];
      for (const call of result.functionCalls) {
        // Validate Permissions
        const isAllowed = await this.permissionsService.checkPermission(userId, call.name);
        
        if (!isAllowed) {
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: "Permission Denied: User does not have access to this tool." },
            }
          });
          continue;
        }

        const requiresConfirm = await this.permissionsService.requiresConfirmation(userId, call.name);
        
        if (requiresConfirm) {
          // Create a pending action
          await this.prisma.aiToolCall.create({
            data: {
              conversationId: conversation.id,
              toolName: call.name,
              inputParams: call.args as any,
              status: AiExecutionStatus.PENDING_CONFIRMATION,
              riskLevel: AiRiskLevel.HIGH,
            }
          });
          finalReply = `⚠️ He preparado la acción **${call.name}**, pero requiere tu confirmación antes de ejecutarse. Por favor aprueba en la interfaz.`;
          break; // Stop execution chain until confirmed
        }

        // Execute Tool
        try {
          const toolResult = await this.toolsService.executeTool(call.name, call.args, userId);
          
          await this.prisma.aiToolCall.create({
            data: {
              conversationId: conversation.id,
              toolName: call.name,
              inputParams: call.args as any,
              outputResult: toolResult as any,
              status: AiExecutionStatus.SUCCESS,
            }
          });

          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { result: toolResult },
            }
          });
        } catch (error: any) {
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: error.message },
            }
          });
        }
      }

      // If we got responses and no pending confirmations halted us, send back to LLM
      if (functionResponses.length > 0 && !finalReply.includes('requiere tu confirmación')) {
        const followUp = await this.routerService.callGemini(functionResponses, toolsDef, [
          ...geminiHistory,
          { role: 'model', parts: result.functionCalls.map(fc => ({ functionCall: fc })) }
        ]);
        finalReply = followUp.text;
      }
    }

    // Save assistant message
    if (finalReply) {
      await this.prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: finalReply,
        },
      });
    }

    return {
      conversationId: conversation.id,
      reply: finalReply,
    };
  }

  async executeDirectAction(userId: string, toolName: string, params: any) {
    const isAllowed = await this.permissionsService.checkPermission(userId, toolName);
    if (!isAllowed) throw new Error('Permission denied');

    const result = await this.toolsService.executeTool(toolName, params, userId);
    return { status: "success", result };
  }

  async handleActionConfirmation(userId: string, confirmationId: string, confirmed: boolean) {
    const toolCall = await this.prisma.aiToolCall.findUnique({
      where: { id: confirmationId },
    });

    if (!toolCall || toolCall.status !== AiExecutionStatus.PENDING_CONFIRMATION) {
      throw new Error('Invalid or already processed confirmation');
    }

    if (!confirmed) {
      await this.prisma.aiToolCall.update({
        where: { id: toolCall.id },
        data: { status: AiExecutionStatus.CANCELLED },
      });
      return { status: "cancelled" };
    }

    const result = await this.toolsService.executeTool(toolCall.toolName, toolCall.inputParams, userId);
    
    await this.prisma.aiToolCall.update({
      where: { id: toolCall.id },
      data: {
        status: AiExecutionStatus.SUCCESS,
        outputResult: result as any,
      },
    });

    return { status: "success", result };
  }
}
