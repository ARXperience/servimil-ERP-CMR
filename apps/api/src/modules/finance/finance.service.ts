import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = dateTo ? new Date(dateTo) : new Date();

    const transactions = await this.prisma.transaction.findMany({
      where: { transactionDate: { gte: from, lte: to } }
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      if (t.type === 'INCOME') totalIncome += Number(t.amount);
      if (t.type === 'EXPENSE') totalExpenses += Number(t.amount);
    });

    const accounts = await this.prisma.account.findMany();
    const balance = accounts.reduce((acc, a) => acc + Number(a.currentBalance), 0);

    return {
      totalIncome,
      totalExpenses,
      balance,
      netIncome: totalIncome - totalExpenses,
      transactionCount: transactions.length,
    };
  }

  async createTransaction(data: CreateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({ data: { ...data, transactionDate: new Date() } as any });
      
      if (transaction.status === 'COMPLETED') {
        const accountId = (data as any).accountId || (data as any).fromAccountId;
        if (!accountId) throw new NotFoundException('Account not specified');
        const account = await tx.account.findUnique({ where: { id: accountId } });
        if (!account) throw new NotFoundException('Account not found');

        const amount = Number(data.amount);
        const newBalance = data.type === 'INCOME' 
          ? Number(account.currentBalance) + amount 
          : Number(account.currentBalance) - amount;

        await tx.account.update({
          where: { id: accountId },
          data: { currentBalance: newBalance }
        });
      }

      return transaction;
    });
  }

  async findAllTransactions(filterDto: TransactionFilterDto) {
    const { dateFrom, dateTo, type, status, categoryId, accountId, minAmount, maxAmount } = filterDto;
    
    const where: any = {};
    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = new Date(dateFrom);
      if (dateTo) where.transactionDate.lte = new Date(dateTo);
    }
    if (type) where.type = type;
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (accountId) {
      where.OR = [
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ];
    }
    if (minAmount) where.amount = { gte: minAmount };
    if (maxAmount) where.amount = { ...where.amount, lte: maxAmount };

    return this.prisma.transaction.findMany({ 
      where,
      orderBy: { transactionDate: 'desc' }
    });
  }

  async findOneTransaction(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async updateTransaction(id: string, data: UpdateTransactionDto) {
    return this.prisma.transaction.update({
      where: { id },
      data: data as any
    });
  }

  async removeTransaction(id: string) {
    return this.prisma.transaction.delete({ where: { id } });
  }

  async findAllAccounts() {
    return this.prisma.account.findMany();
  }

  async createAccount(data: CreateAccountDto) {
    return this.prisma.account.create({ data: data as any });
  }

  async findAllCategories() {
    return this.prisma.category.findMany();
  }

  async createCategory(data: CreateCategoryDto) {
    return this.prisma.category.create({ data: data as any });
  }

  async getCashFlow(months: number) {
    // A simplified projection logic based on historical averages
    return {
      projection: `Projected cash flow for ${months} months.`,
      months
    };
  }

  async getPnl(dateFrom?: string, dateTo?: string) {
    const dashboard = await this.getDashboard(dateFrom, dateTo);
    return {
      revenue: dashboard.totalIncome,
      cogs: 0,
      grossProfit: dashboard.totalIncome,
      operatingExpenses: dashboard.totalExpenses,
      netProfit: dashboard.netIncome
    };
  }

  async reconcile(accountId: string, transactionIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.transaction.updateMany({
        where: { id: { in: transactionIds }, fromAccountId: accountId } as any,
        data: { status: 'RECONCILED' as any }
      });
      return { success: true, reconciledCount: transactionIds.length };
    });
  }
}
