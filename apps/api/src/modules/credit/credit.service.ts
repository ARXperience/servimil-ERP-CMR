import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCreditRequestDto } from './dto/create-credit-request.dto';
import { UpdateCreditRequestDto } from './dto/update-credit-request.dto';
import { CreditFilterDto } from './dto/credit-filter.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { CreateCollectionActionDto } from './dto/create-collection-action.dto';

@Injectable()
export class CreditService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const credits = await this.prisma.creditRequest.findMany({
      where: { status: 'DISBURSED' }
    });

    const overdueInstallments = await this.prisma.creditInstallment.findMany({
      where: { isPaid: false, dueDate: { lt: new Date() } }
    });

    const activePortfolioValue = credits.reduce((acc: number, c) => acc + Number(c.requestedAmount), 0);
    const overduePortfolioValue = overdueInstallments.reduce((acc: number, i) => acc + Number(i.totalAmount), 0);

    return {
      activeCredits: credits.length,
      activePortfolioValue,
      overdueInstallmentsCount: overdueInstallments.length,
      overduePortfolioValue,
    };
  }

  async createRequest(data: CreateCreditRequestDto) {
    const score = this.calculateRiskScore(data.amount, data.term, data.interestRate);
    return this.prisma.creditRequest.create({
      data: {
        requestNumber: `CR-${Date.now()}`,
        clientId: (data as any).customerId || (data as any).clientId,
        requestedAmount: data.amount,
        interestRate: data.interestRate,
        term: data.term,
        status: 'DRAFT',
        riskScore: score,
      } as any
    });
  }

  calculateRiskScore(amount: number, term: number, interestRate: number): number {
    // Basic risk calculation mock
    let score = 100;
    if (amount > 50000000) score -= 20;
    if (term > 36) score -= 10;
    if (interestRate > 2) score += 5;
    return Math.max(0, Math.min(100, score));
  }

  async findAllRequests(filter: CreditFilterDto) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.customerId) where.clientId = filter.customerId;
    
    return this.prisma.creditRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async updateRequest(id: string, data: UpdateCreditRequestDto) {
    return this.prisma.creditRequest.update({ where: { id }, data: data as any });
  }

  async approveRequest(id: string) {
    const credit = await this.prisma.creditRequest.findUnique({ where: { id } });
    if (!credit) throw new NotFoundException('Credit request not found');
    if (credit.status !== 'DRAFT' && credit.status !== 'SUBMITTED') {
      throw new BadRequestException('Invalid status transition');
    }

    return this.prisma.creditRequest.update({
      where: { id },
      data: { status: 'APPROVED' }
    });
  }

  async rejectRequest(id: string) {
    return this.prisma.creditRequest.update({
      where: { id },
      data: { status: 'REJECTED' }
    });
  }

  async disburseRequest(id: string) {
    const credit = await this.prisma.creditRequest.findUnique({ where: { id } });
    if (!credit) throw new NotFoundException('Credit request not found');
    if (credit.status !== 'APPROVED') {
      throw new BadRequestException('Only approved credits can be disbursed');
    }

    return this.prisma.$transaction(async (tx) => {
      const activeCredit = await tx.creditRequest.update({
        where: { id },
        data: { status: 'DISBURSED', disbursedAt: new Date() }
      });

      // Generate Amortization Table (French system - Fixed payments)
      const P = Number(credit.requestedAmount);
      const r = Number(credit.interestRate || 0) / 100;
      const n = credit.term || 12;
      const payment = r > 0 
        ? (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
        : P / n;

      let balance = P;
      const installments = [];

      for (let i = 1; i <= n; i++) {
        const interest = balance * r;
        const principal = payment - interest;
        balance -= principal;
        
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);

        installments.push({
          creditId: credit.id,
          installmentNumber: i,
          totalAmount: payment,
          principalAmount: principal,
          interestAmount: interest,
          dueDate,
        });
      }

      await tx.creditInstallment.createMany({ data: installments as any });

      return activeCredit;
    });
  }

  async getPortfolio() {
    return this.prisma.creditRequest.findMany({
      where: { status: 'DISBURSED' },
      include: { client: true }
    });
  }

  async getOverduePortfolio() {
    const today = new Date();
    return this.prisma.creditInstallment.findMany({
      where: { 
        isPaid: false,
        dueDate: { lt: today }
      } as any,
      include: { credit: { include: { client: true } } }
    });
  }

  async getInstallments(creditId: string) {
    return this.prisma.creditInstallment.findMany({
      where: { creditId },
      orderBy: { installmentNumber: 'asc' }
    });
  }

  async payInstallment(id: string, data: PayInstallmentDto) {
    return this.prisma.creditInstallment.update({
      where: { id },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paidAmount: data.amountPaid,
      } as any
    });
  }

  async getCollections() {
    return this.prisma.collectionAction.findMany({
      orderBy: { createdAt: 'desc' },
      include: { credit: true }
    });
  }

  async createCollectionAction(data: CreateCollectionActionDto) {
    return this.prisma.collectionAction.create({ 
      data: { ...data, description: (data as any).description || 'Collection action' } as any 
    });
  }
}
