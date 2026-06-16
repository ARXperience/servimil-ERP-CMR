import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CaseFilterDto } from './dto/case-filter.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@Injectable()
export class LegalService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [casesByStatus, casesByPriority, upcomingEventsCount] = await Promise.all([
      this.prisma.legalCase.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.legalCase.groupBy({
        by: ['priority'],
        _count: true,
      }),
      this.prisma.legalEvent.count({
        where: {
          scheduledAt: { gte: new Date() },
          eventType: 'DEADLINE',
        } as any,
      }),
    ]);

    return {
      casesByStatus,
      casesByPriority,
      upcomingEventsCount,
    };
  }

  async createCase(dto: CreateCaseDto) {
    return this.prisma.legalCase.create({
      data: dto as any,
    });
  }

  async getCases(filter: CaseFilterDto) {
    const where: any = {};
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { caseNumber: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.clientId) where.clientId = filter.clientId;
    if (filter.assignedToId) where.assignedToId = filter.assignedToId;

    return this.prisma.legalCase.findMany({
      where,
      include: { client: true, assignedTo: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCase(id: string) {
    const legalCase = await this.prisma.legalCase.findUnique({
      where: { id },
      include: { client: true, assignedTo: true, events: true, documents: true },
    });
    if (!legalCase) throw new NotFoundException('Case not found');
    return legalCase;
  }

  async updateCase(id: string, dto: UpdateCaseDto) {
    return this.prisma.legalCase.update({
      where: { id },
      data: dto as any,
    });
  }

  async deleteCase(id: string) {
    return this.prisma.legalCase.delete({ where: { id } });
  }

  async createEvent(dto: CreateEventDto) {
    return this.prisma.legalEvent.create({
      data: dto as any,
    });
  }

  async getEvents() {
    return this.prisma.legalEvent.findMany();
  }

  async updateEvent(id: string, dto: UpdateEventDto) {
    return this.prisma.legalEvent.update({
      where: { id },
      data: dto as any,
    });
  }

  async getCalendar(query: CalendarQueryDto) {
    return this.prisma.legalEvent.findMany({
      where: {
        scheduledAt: { gte: new Date(query.startDate) },
        ...(query.endDate ? { completedAt: { lte: new Date(query.endDate) } } : {}),
      } as any,
      include: { case: true },
    });
  }

  async getUpcomingDeadlines() {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return this.prisma.legalEvent.findMany({
      where: {
        eventType: 'deadline',
        scheduledAt: {
          gte: today,
          lte: nextWeek,
        },
      } as any,
      include: { case: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
