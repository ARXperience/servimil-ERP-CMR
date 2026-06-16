import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiPermissionsService {
  private readonly logger = new Logger(AiPermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkPermission(userId: string, toolName: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    // Admins bypass
    if (user.role === 'ADMIN') return true;

    // Check matrix
    const permission = await this.prisma.aiPermissionsMatrix.findUnique({
      where: {
        role_toolName: {
          role: user.role,
          toolName: toolName,
        }
      }
    });

    if (permission) {
      return permission.isAllowed;
    }

    // Default to allowed for now during development if not defined
    this.logger.warn(`No explicit permission defined for role ${user.role} and tool ${toolName}. Defaulting to true for DEV.`);
    return true; 
  }

  async requiresConfirmation(userId: string, toolName: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return true; // Default safe

    const permission = await this.prisma.aiPermissionsMatrix.findUnique({
      where: {
        role_toolName: {
          role: user.role,
          toolName: toolName,
        }
      }
    });

    if (permission) {
      return permission.requiresConfirm;
    }

    // Tools that modify state should require confirmation by default
    const sensitiveTools = ['create_reminder', 'send_whatsapp_message', 'update_client'];
    return sensitiveTools.includes(toolName);
  }
}
