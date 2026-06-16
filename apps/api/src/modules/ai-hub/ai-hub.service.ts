import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiHubService {
  private readonly logger = new Logger(AiHubService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  async getConversationDetails(userId: string, conversationId: string) {
    return this.prisma.aiConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        toolCalls: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async getExecutionLogs(userId: string) {
    // Ideally validate if user is admin/supervisor
    return this.prisma.aiExecutionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { firstName: true, lastName: true, role: true } },
        toolCall: true,
      },
    });
  }

  async getAvailableTools(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    const tools = await this.prisma.aiPermissionsMatrix.findMany({
      where: { role: user.role, isAllowed: true },
    });

    if (tools.length === 0) {
      return [
        { id: 't1', toolName: 'get_unanswered_messages', module: 'WhatsApp', description: 'Lee tus mensajes pendientes y sin responder en WhatsApp.', isAllowed: true, requiresConfirmation: false },
        { id: 't2', toolName: 'search_contacts', module: 'CRM', description: 'Busca clientes en el sistema por su nombre, teléfono o cédula.', isAllowed: true, requiresConfirmation: false },
        { id: 't3', toolName: 'get_hot_leads', module: 'CRM', description: 'Lista tus prospectos comerciales calificados o en negociación.', isAllowed: true, requiresConfirmation: false },
        { id: 't4', toolName: 'create_reminder', module: 'Agenda', description: 'Agenda y asigna una tarea de seguimiento en tu calendario.', isAllowed: true, requiresConfirmation: true },
        { id: 't5', toolName: 'query_database', module: 'Core', description: 'Realiza consultas de lectura directa a finanzas, nómina y transacciones.', isAllowed: true, requiresConfirmation: false },
        { id: 't6', toolName: 'generate_financial_report', module: 'Finanzas', description: 'Genera un reporte rápido de ingresos y gastos del mes actual.', isAllowed: true, requiresConfirmation: false },
        { id: 't7', toolName: 'get_employee_payroll', module: 'Nómina', description: 'Consulta el estado y valor de la nómina de un empleado.', isAllowed: true, requiresConfirmation: false },
        { id: 't8', toolName: 'create_client', module: 'CRM', description: 'Registra un nuevo cliente o prospecto rápidamente en la base de datos.', isAllowed: true, requiresConfirmation: true },
        { id: 't9', toolName: 'schedule_meeting', module: 'Agenda', description: 'Programa una reunión formal con un cliente e invita a los participantes.', isAllowed: true, requiresConfirmation: true },
        { id: 't10', toolName: 'check_credit_status', module: 'Créditos', description: 'Verifica el estado de aprobación o mora de un crédito activo.', isAllowed: true, requiresConfirmation: false },
      ];
    }
    return tools;
  }

  async getSettings() {
    const settings = await this.prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'AI_',
        },
      },
    });

    if (settings.length === 0) {
      return [
        { id: 's1', key: 'AI_PROVIDER', value: 'Gemini 2.5 Flash', description: 'Motor principal de inteligencia artificial.' },
        { id: 's2', key: 'AI_TEMPERATURE', value: '0.7', description: 'Nivel de creatividad y variación en las respuestas.' },
        { id: 's3', key: 'AI_ORCHESTRATOR', value: 'Activado', description: 'Permite al asistente tomar decisiones y usar herramientas.' },
        { id: 's4', key: 'AI_MAX_CONTEXT', value: '20 mensajes', description: 'Memoria a corto plazo mantenida en cada conversación.' },
      ];
    }
    return settings;
  }
}
