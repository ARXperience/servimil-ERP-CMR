import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadFilterDto } from './dto/lead-filter.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateAutomationDto } from './dto/create-automation.dto';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const leads = await this.prisma.lead.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { estimatedValue: true }
    });

    const activeActivities = await this.prisma.activity.count({
      where: { status: 'PENDING' } as any
    });

    let totalLeads = 0;
    let totalValue = 0;
    leads.forEach(l => {
      totalLeads += l._count.id;
      totalValue += Number(l._sum.estimatedValue || 0);
    });

    return {
      totalLeads,
      totalPipelineValue: totalValue,
      pendingActivities: activeActivities,
      funnel: leads.map(l => ({
        status: l.status,
        count: l._count.id,
        value: Number(l._sum.estimatedValue || 0)
      }))
    };
  }

  async createLead(data: CreateLeadDto) {
    const lead = await this.prisma.lead.create({
      data: {
        ...data,
        scoreAi: this.calculateLeadScore(data)
      } as any
    });
    
    // Evaluate automations
    await this.evaluateAutomations('LEAD_CREATED', lead);
    
    return lead;
  }

  calculateLeadScore(data: any): number {
    let score = 0;
    if (data.email) score += 10;
    if (data.phone) score += 10;
    if (data.estimatedValue > 10000000) score += 20;
    if (data.source === 'REFERRAL') score += 30;
    return score;
  }

  async findAllLeads(filter: LeadFilterDto) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.source) where.source = filter.source;
    if (filter.assignedToId) where.assignedToId = filter.assignedToId;
    if (filter.tags) {
      // Assuming simple string includes for JSON/Array tags in this example
      where.tags = { hasSome: filter.tags };
    }
    
    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) where.createdAt.gte = new Date(filter.dateFrom);
      if (filter.dateTo) where.createdAt.lte = new Date(filter.dateTo);
    }

    return this.prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async updateLead(id: string, data: UpdateLeadDto) {
    return this.prisma.lead.update({ where: { id }, data: data as any });
  }

  async removeLead(id: string) {
    return this.prisma.lead.delete({ where: { id } });
  }

  async updateLeadStatus(id: string, status: string) {
    const lead = await this.prisma.lead.update({
      where: { id },
      data: { status: status as any }
    });
    
    await this.evaluateAutomations('LEAD_STATUS_CHANGED', lead);
    
    return lead;
  }

  async assignLead(id: string, assignedToId: string) {
    return this.prisma.lead.update({
      where: { id },
      data: { assignedToId }
    });
  }

  async createActivity(data: CreateActivityDto) {
    return this.prisma.activity.create({ data: { ...data, subject: (data as any).title || 'Task' } as any });
  }

  async findAllActivities() {
    return this.prisma.activity.findMany({ orderBy: { scheduledAt: 'asc' } as any });
  }

  async updateActivity(id: string, data: UpdateActivityDto) {
    return this.prisma.activity.update({ where: { id }, data: data as any });
  }

  async getPipeline() {
    const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    
    const leads = await this.prisma.lead.findMany();
    
    return statuses.map(status => {
      const statusLeads = leads.filter(l => l.status === status);
      return {
        status,
        count: statusLeads.length,
        value: statusLeads.reduce((acc, l) => acc + Number(l.estimatedValue || 0), 0),
        leads: statusLeads
      };
    });
  }

  async createAutomation(data: CreateAutomationDto) {
    return this.prisma.automation.create({ data: data as any });
  }

  async findAllAutomations() {
    return this.prisma.automation.findMany();
  }

  async updateAutomation(id: string, data: any) {
    return this.prisma.automation.update({ where: { id }, data });
  }

  // Simple rule engine for automations
  async evaluateAutomations(trigger: string, payload: any) {
    const automations = await this.prisma.automation.findMany({
      where: { trigger: trigger as any, isActive: true }
    });

    for (const rule of automations) {
      let conditionsMet = true;
      // Basic condition parsing (e.g. { "field": "status", "value": "QUALIFIED" })
      if (rule.conditions) {
        const cond = rule.conditions as any;
        if (payload[cond.field] !== cond.value) {
          conditionsMet = false;
        }
      }

      if (conditionsMet) {
        // Execute action (e.g. Create Activity, Send Email)
        const action = (rule as any).actions as any || {};
        if (action.type === 'CREATE_ACTIVITY') {
          await this.prisma.activity.create({
            data: {
              type: action.activityType || 'TASK',
              subject: action.title || 'Automated Task',
              leadId: payload.id,
              dueDate: new Date(),
              status: 'PENDING'
            } as any
          });
        }
      }
    }
  }
}
