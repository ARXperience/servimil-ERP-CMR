import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private getMetricsFile() {
    const metricsPath = path.join(process.cwd(), 'dashboard-metrics.json');
    if (fs.existsSync(metricsPath)) {
      return JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    }
    return {};
  }

  async getFinancialSummary() {
    const metrics = this.getMetricsFile();
    if (metrics.finance) return metrics.finance;
    
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      pendingInvoices: 0,
    };
  }

  async getPortfolioSummary() {
    const metrics = this.getMetricsFile();
    if (metrics.portfolio) return metrics.portfolio;

    return {
      activeCredits: 0,
      totalCreditAmount: 0,
      overdueAmount: 0,
      riskDistribution: { low: 0, medium: 0, high: 0 },
    };
  }

  async getCrmSummary() {
    const metrics = this.getMetricsFile();
    
    const leadsByStatus = await this.prisma.lead.groupBy({
      by: ['status'],
      _count: true,
    });

    const realLeads = leadsByStatus.reduce((acc, curr) => acc + curr._count, 0);

    return {
      totalLeads: metrics.totalLeads ? metrics.totalLeads : realLeads,
      leadsByStatus,
      conversionRate: '15%',
    };
  }

  async getPayrollSummary() {
    const metrics = this.getMetricsFile();
    if (metrics.payroll) return metrics.payroll;

    return {
      totalEmployees: 0,
      monthlyPayroll: 0,
      activeLeaves: 0,
    };
  }

  /**
   * CRM & AI Analytics — Real data from conversations, leads, and clients.
   */
  async getCrmAiAnalytics() {
    // ── 1. Funnel Distribution (from Conversations) ──
    const funnelRaw = await this.prisma.conversation.groupBy({
      by: ['funnelStage'],
      _count: true,
    });

    const funnelStageLabels: Record<string, string> = {
      NUEVO: 'Nuevo',
      INTERESADO: 'Interesado',
      NEGOCIANDO: 'Negociando',
      CLIENTE: 'Cliente',
      SOPORTE: 'Soporte',
      DESCARTADO: 'Descartado',
    };

    const funnelDistribution = Object.keys(funnelStageLabels).map(stage => {
      const found = funnelRaw.find(f => f.funnelStage === stage);
      return {
        stage,
        label: funnelStageLabels[stage],
        count: found?._count || 0,
      };
    });

    const totalConversations = funnelDistribution.reduce((acc, f) => acc + f.count, 0);

    // ── 2. Sentiment Analysis (from sentimentScore in conversations) ──
    const allConversations = await this.prisma.conversation.findMany({
      select: { sentimentScore: true },
      where: { sentimentScore: { not: null } },
    });

    let positive = 0, neutral = 0, negative = 0;
    for (const conv of allConversations) {
      if (conv.sentimentScore === null || conv.sentimentScore === undefined) continue;
      if (conv.sentimentScore > 0) positive++;
      else if (conv.sentimentScore < 0) negative++;
      else neutral++;
    }

    const sentimentData = [
      { label: 'Positivo', count: positive, color: '#22c55e' },
      { label: 'Neutral', count: neutral, color: '#eab308' },
      { label: 'Negativo', count: negative, color: '#ef4444' },
    ];

    // ── 3. Lead Metrics ──
    const totalLeads = await this.prisma.lead.count();
    const wonLeads = await this.prisma.lead.count({ where: { status: 'WON' } });
    const lostLeads = await this.prisma.lead.count({ where: { status: 'LOST' } });
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    const leadsBySource = await this.prisma.lead.groupBy({
      by: ['source'],
      _count: true,
      orderBy: { _count: { source: 'desc' } },
    });

    // ── 4. Client Metrics ──
    const totalClients = await this.prisma.client.count({ where: { isActive: true } });
    const clientsThisMonth = await this.prisma.client.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    // ── 5. Conversations this month ──
    const conversationsThisMonth = await this.prisma.conversation.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    // ── 6. Messages count (bot efficiency) ──
    const totalMessages = await this.prisma.message.count();
    const botMessages = await this.prisma.message.count({
      where: { direction: 'OUTBOUND' },
    });

    return {
      funnelDistribution,
      totalConversations,
      sentimentData,
      leads: {
        total: totalLeads,
        won: wonLeads,
        lost: lostLeads,
        conversionRate,
        bySource: leadsBySource.map(l => ({
          source: l.source,
          count: l._count,
        })),
      },
      clients: {
        total: totalClients,
        newThisMonth: clientsThisMonth,
      },
      conversations: {
        total: totalConversations,
        newThisMonth: conversationsThisMonth,
      },
      botEfficiency: {
        totalMessages,
        botMessages,
        automationRate: totalMessages > 0 ? Math.round((botMessages / totalMessages) * 100) : 0,
      },
    };
  }

  async getGeneralDashboard() {
    const [finance, portfolio, crm, payroll, crmAi] = await Promise.all([
      this.getFinancialSummary(),
      this.getPortfolioSummary(),
      this.getCrmSummary(),
      this.getPayrollSummary(),
      this.getCrmAiAnalytics(),
    ]);

    const casesCount = await this.prisma.legalCase.count();
    const conversationsCount = await this.prisma.conversation.count();

    return {
      finance,
      portfolio,
      crm,
      payroll,
      crmAi,
      legal: { casesCount },
      communications: { conversationsCount },
    };
  }
}
