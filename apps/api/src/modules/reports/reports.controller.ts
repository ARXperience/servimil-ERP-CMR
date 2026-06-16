import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { DataImportService } from './data-import.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly dataImportService: DataImportService,
  ) {}

  @Get('financial-summary')
  @ApiOperation({ summary: 'Get financial summary' })
  getFinancialSummary() {
    return this.reportsService.getFinancialSummary();
  }

  @Get('portfolio-summary')
  @ApiOperation({ summary: 'Get credit portfolio summary' })
  getPortfolioSummary() {
    return this.reportsService.getPortfolioSummary();
  }

  @Get('crm-summary')
  @ApiOperation({ summary: 'Get CRM and leads summary' })
  getCrmSummary() {
    return this.reportsService.getCrmSummary();
  }

  @Get('payroll-summary')
  @ApiOperation({ summary: 'Get payroll summary' })
  getPayrollSummary() {
    return this.reportsService.getPayrollSummary();
  }

  @Get('general-dashboard')
  @ApiOperation({ summary: 'Get general executive dashboard data' })
  getGeneralDashboard() {
    return this.reportsService.getGeneralDashboard();
  }

  @Post('import-data')
  @ApiOperation({ summary: 'Import CSV or link from Google Sheets' })
  async importData(@Body() body: { type: 'link' | 'csv'; content: string }) {
    if (body.type === 'link') {
      return this.dataImportService.fetchGoogleSheetCsv(body.content);
    } else {
      return this.dataImportService.processImportData(body.content, 'CSV Upload');
    }
  }
}
