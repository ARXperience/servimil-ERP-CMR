import { ApiProperty } from '@nestjs/swagger';

export class FinancialDashboardDto {
  @ApiProperty()
  totalIncome: number;

  @ApiProperty()
  totalExpenses: number;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  netIncome: number;

  @ApiProperty()
  transactionCount: number;
}
