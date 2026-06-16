import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Finance')
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get financial dashboard data' })
  getDashboard(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.financeService.getDashboard(dateFrom, dateTo);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Create a transaction' })
  createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.financeService.createTransaction(createTransactionDto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transactions with filters' })
  findAllTransactions(@Query() filterDto: TransactionFilterDto) {
    return this.financeService.findAllTransactions(filterDto);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction by id' })
  findOneTransaction(@Param('id') id: string) {
    return this.financeService.findOneTransaction(id);
  }

  @Patch('transactions/:id')
  @ApiOperation({ summary: 'Update transaction' })
  updateTransaction(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.financeService.updateTransaction(id, updateTransactionDto);
  }

  @Delete('transactions/:id')
  @ApiOperation({ summary: 'Delete transaction' })
  removeTransaction(@Param('id') id: string) {
    return this.financeService.removeTransaction(id);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get all financial accounts' })
  findAllAccounts() {
    return this.financeService.findAllAccounts();
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create a financial account' })
  createAccount(@Body() createAccountDto: CreateAccountDto) {
    return this.financeService.createAccount(createAccountDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all transaction categories' })
  findAllCategories() {
    return this.financeService.findAllCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a transaction category' })
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.financeService.createCategory(createCategoryDto);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get cash flow projection' })
  getCashFlow(@Query('months') months?: string) {
    return this.financeService.getCashFlow(months ? parseInt(months) : 6);
  }

  @Get('pnl')
  @ApiOperation({ summary: 'Get Profit and Loss statement' })
  getPnl(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.financeService.getPnl(dateFrom, dateTo);
  }

  @Post('reconciliation')
  @ApiOperation({ summary: 'Reconcile account transactions' })
  reconcile(@Body() data: { accountId: string; transactionIds: string[] }) {
    return this.financeService.reconcile(data.accountId, data.transactionIds);
  }
}
