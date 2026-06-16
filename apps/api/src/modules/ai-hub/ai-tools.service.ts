import { Injectable, Logger } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiToolsService {
  private readonly logger = new Logger(AiToolsService.name);

  constructor(private readonly prisma: PrismaService) {}

  getGeminiToolsDefinition(): any {
    return [
      {
        functionDeclarations: [
          {
            name: 'get_unanswered_messages',
            description: 'Obtiene la lista de conversaciones de WhatsApp que no han sido respondidas o están pendientes.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                limit: {
                  type: SchemaType.INTEGER,
                  description: 'Número máximo de chats a devolver',
                },
              },
            },
          },
          {
            name: 'search_contacts',
            description: 'Busca clientes o prospectos en el CRM por nombre, teléfono o cédula.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                query: {
                  type: SchemaType.STRING,
                  description: 'Término de búsqueda (nombre, teléfono, cédula)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_hot_leads',
            description: 'Obtiene la lista de prospectos calientes (Hot Leads) asignados al usuario.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {},
            },
          },
          {
            name: 'create_reminder',
            description: 'Crea un recordatorio o tarea para hacer seguimiento a un cliente.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                clientId: { type: SchemaType.STRING, description: 'ID del cliente (UUID)' },
                title: { type: SchemaType.STRING, description: 'Título de la tarea' },
                dueDate: { type: SchemaType.STRING, description: 'Fecha de vencimiento en formato ISO 8601' },
              },
              required: ['title', 'dueDate'],
            },
          },
          {
            name: 'query_database',
            description: 'Busca y extrae información de CUALQUIER módulo de la base de datos (clientes, nómina, finanzas, ventas, etc.). Permite hacer consultas dinámicas de lectura a Prisma.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                model: {
                  type: SchemaType.STRING,
                  description: 'Nombre del modelo en Prisma (ej. client, user, transaction, payroll, lead, account, creditRequest)',
                },
                operation: {
                  type: SchemaType.STRING,
                  description: 'Operación a realizar. SOLO PERMITIDAS: findMany, findFirst, count',
                },
                queryString: {
                  type: SchemaType.STRING,
                  description: 'String en formato JSON con los argumentos de Prisma (ej. {"where": {"status": "ACTIVE"}, "take": 5, "orderBy": {"createdAt": "desc"}})',
                },
              },
              required: ['model', 'operation', 'queryString'],
            },
          },
          {
            name: 'generate_financial_report',
            description: 'Obtiene un resumen de ingresos y gastos totales del sistema.',
            parameters: { type: SchemaType.OBJECT, properties: {} }
          },
          {
            name: 'get_employee_payroll',
            description: 'Obtiene los detalles de nómina de un empleado específico usando su código.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: { employeeCode: { type: SchemaType.STRING, description: 'Código del empleado' } },
              required: ['employeeCode']
            }
          },
          {
            name: 'create_client',
            description: 'Crea un nuevo cliente o prospecto en el sistema.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                firstName: { type: SchemaType.STRING },
                lastName: { type: SchemaType.STRING },
                documentNumber: { type: SchemaType.STRING },
                phone: { type: SchemaType.STRING }
              },
              required: ['firstName', 'lastName', 'documentNumber']
            }
          },
          {
            name: 'schedule_meeting',
            description: 'Programa una reunión o visita con un cliente.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                clientId: { type: SchemaType.STRING, description: 'UUID del cliente (opcional)' },
                subject: { type: SchemaType.STRING },
                date: { type: SchemaType.STRING, description: 'Fecha de la reunión en formato ISO 8601' }
              },
              required: ['subject', 'date']
            }
          },
          {
            name: 'check_credit_status',
            description: 'Consulta el estado de una solicitud de crédito.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: { requestNumber: { type: SchemaType.STRING, description: 'Número de solicitud' } },
              required: ['requestNumber']
            }
          }
        ],
      },
    ];
  }

  async executeTool(toolName: string, args: any, userId: string) {
    this.logger.log(`Executing tool: ${toolName} with args: ${JSON.stringify(args)}`);
    
    switch (toolName) {
      case 'get_unanswered_messages':
        const limit = args.limit || 5;
        const unreadChats = await this.prisma.whatsappSession.findMany({
          where: { status: 'CONNECTED' }, // Simplified for now
          take: limit,
        });
        return unreadChats;

      case 'search_contacts':
        const search = args.query;
        const clients = await this.prisma.client.findMany({
          where: {
            OR: [
              { documentNumber: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { businessName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ]
          },
          take: 5,
        });
        return clients;

      case 'get_hot_leads':
        const leads = await this.prisma.lead.findMany({
          where: { assignedToId: userId, status: 'QUALIFIED' },
          take: 10,
        });
        return leads;

      case 'create_reminder':
        const activity = await this.prisma.activity.create({
          data: {
            subject: args.title,
            type: 'TASK',
            scheduledAt: new Date(args.dueDate),
            clientId: args.clientId || undefined,
            userId: userId,
            metadata: { source: 'AI_HUB' }
          } as any
        });
        return { success: true, taskId: activity.id, message: `Recordatorio creado: ${args.title}` };

      case 'query_database':
        const { model, operation, queryString } = args;
        try {
          const prismaModel = model.charAt(0).toLowerCase() + model.slice(1);
          
          if (!['findMany', 'findFirst', 'count'].includes(operation)) {
            return { error: 'Operación no permitida. Solo se permite findMany, findFirst o count para proteger los datos.' };
          }

          if (!(this.prisma as any)[prismaModel]) {
             return { error: `El modelo ${model} no existe en la base de datos.` };
          }

          let queryArgs: any = {};
          try {
            queryArgs = typeof queryString === 'string' ? JSON.parse(queryString) : queryString;
          } catch (e) {
            return { error: 'El queryString no es un JSON válido.' };
          }

          // Limit the number of records returned to avoid token overflow
          if (operation === 'findMany') {
            queryArgs.take = queryArgs.take ? Math.min(queryArgs.take, 50) : 20;
          }

          const dbResult = await (this.prisma as any)[prismaModel][operation](queryArgs);
          return { model: prismaModel, operation, result: dbResult };
        } catch (error: any) {
          this.logger.error(`Error in query_database: ${error.message}`);
          return { error: `Fallo al ejecutar la consulta: ${error.message}` };
        }

      case 'generate_financial_report':
        const incomes = await this.prisma.transaction.aggregate({ where: { type: 'INCOME' }, _sum: { amount: true } });
        const expenses = await this.prisma.transaction.aggregate({ where: { type: 'EXPENSE' }, _sum: { amount: true } });
        return { totalIncomes: incomes._sum.amount || 0, totalExpenses: expenses._sum.amount || 0 };

      case 'get_employee_payroll':
        const emp = await this.prisma.employee.findUnique({ 
          where: { employeeCode: args.employeeCode }, 
          include: { payrollItems: { take: 1, orderBy: { createdAt: 'desc' } } } 
        });
        if (!emp) return { error: 'Empleado no encontrado.' };
        return { 
          employee: `${emp.employeeCode}`, 
          status: emp.status, 
          baseSalary: emp.baseSalary,
          lastPayroll: emp.payrollItems[0] || 'No tiene nóminas registradas' 
        };

      case 'create_client':
        const newClient = await this.prisma.client.create({
          data: {
            documentType: 'CC',
            documentNumber: args.documentNumber,
            firstName: args.firstName,
            lastName: args.lastName,
            phone: args.phone
          }
        });
        return { success: true, message: `Cliente creado con éxito`, client: newClient };

      case 'schedule_meeting':
        const meeting = await this.prisma.activity.create({
          data: {
            subject: args.subject,
            type: 'MEETING',
            scheduledAt: new Date(args.date),
            clientId: args.clientId || undefined,
            userId: userId,
            metadata: { source: 'AI_HUB' }
          } as any
        });
        return { success: true, message: `Reunión agendada para ${args.date}`, meetingId: meeting.id };

      case 'check_credit_status':
        const credit = await this.prisma.creditRequest.findUnique({ 
          where: { requestNumber: args.requestNumber } 
        });
        if (!credit) return { error: 'Crédito no encontrado con ese número de solicitud.' };
        return { 
          requestNumber: credit.requestNumber, 
          status: credit.status, 
          amount: credit.requestedAmount,
          term: credit.term 
        };

      default:
        throw new Error(`Tool ${toolName} not found or not implemented`);
    }
  }
}
