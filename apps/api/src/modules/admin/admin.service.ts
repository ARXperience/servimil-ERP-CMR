import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(filters: any) {
    const where: any = {};
    if (filters.action) where.action = filters.action;
    if (filters.userId) where.userId = filters.userId;
    if (filters.entityType) where.entityType = filters.entityType;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ? parseInt(filters.limit, 10) : 50,
    });
  }

  async getSystemConfig() {
    return this.prisma.systemConfig.findMany();
  }

  async updateSystemConfig(key: string, value: any) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'OK', database: 'connected', timestamp: new Date() };
    } catch (error) {
      return { status: 'ERROR', database: 'disconnected', timestamp: new Date() };
    }
  }

  async getStats() {
    const [users, leads, activeSessions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.lead.count(),
      this.prisma.whatsappSession.count({ where: { status: 'CONNECTED' } }),
    ]);

    return {
      users,
      leads,
      activeSessions,
      uptime: process.uptime(),
    };
  }
}
