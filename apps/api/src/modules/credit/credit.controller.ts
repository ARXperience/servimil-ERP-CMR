import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreateCreditRequestDto } from './dto/create-credit-request.dto';
import { UpdateCreditRequestDto } from './dto/update-credit-request.dto';
import { CreditFilterDto } from './dto/credit-filter.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { CreateCollectionActionDto } from './dto/create-collection-action.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Credit')
@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get portfolio dashboard data' })
  getDashboard() {
    return this.creditService.getDashboard();
  }

  @Post('requests')
  @ApiOperation({ summary: 'Create a credit request' })
  createRequest(@Body() createCreditRequestDto: CreateCreditRequestDto) {
    return this.creditService.createRequest(createCreditRequestDto);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get all credit requests' })
  findAllRequests(@Query() filterDto: CreditFilterDto) {
    return this.creditService.findAllRequests(filterDto);
  }

  @Patch('requests/:id')
  @ApiOperation({ summary: 'Update a credit request' })
  updateRequest(@Param('id') id: string, @Body() updateCreditRequestDto: UpdateCreditRequestDto) {
    return this.creditService.updateRequest(id, updateCreditRequestDto);
  }

  @Post('requests/:id/approve')
  @ApiOperation({ summary: 'Approve a credit request' })
  approveRequest(@Param('id') id: string) {
    return this.creditService.approveRequest(id);
  }

  @Post('requests/:id/reject')
  @ApiOperation({ summary: 'Reject a credit request' })
  rejectRequest(@Param('id') id: string) {
    return this.creditService.rejectRequest(id);
  }

  @Post('requests/:id/disburse')
  @ApiOperation({ summary: 'Disburse an approved credit request' })
  disburseRequest(@Param('id') id: string) {
    return this.creditService.disburseRequest(id);
  }

  @Get('portfolio')
  @ApiOperation({ summary: 'Get active portfolio' })
  getPortfolio() {
    return this.creditService.getPortfolio();
  }

  @Get('portfolio/overdue')
  @ApiOperation({ summary: 'Get overdue portfolio' })
  getOverduePortfolio() {
    return this.creditService.getOverduePortfolio();
  }

  @Get('installments/:creditId')
  @ApiOperation({ summary: 'Get installments for a credit' })
  getInstallments(@Param('creditId') creditId: string) {
    return this.creditService.getInstallments(creditId);
  }

  @Post('installments/:id/pay')
  @ApiOperation({ summary: 'Pay an installment' })
  payInstallment(@Param('id') id: string, @Body() payInstallmentDto: PayInstallmentDto) {
    return this.creditService.payInstallment(id, payInstallmentDto);
  }

  @Get('collections')
  @ApiOperation({ summary: 'Get collection actions' })
  getCollections() {
    return this.creditService.getCollections();
  }

  @Post('collections')
  @ApiOperation({ summary: 'Create a collection action' })
  createCollectionAction(@Body() createCollectionActionDto: CreateCollectionActionDto) {
    return this.creditService.createCollectionAction(createCollectionActionDto);
  }
}
