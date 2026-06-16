import { ApiProperty } from '@nestjs/swagger';

export class PayrollDashboardDto {
  @ApiProperty()
  activeEmployees: number;

  @ApiProperty()
  totalPayrollExpenses: number;

  @ApiProperty()
  recentRuns: any[];
}
