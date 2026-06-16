import { ApiProperty } from '@nestjs/swagger';

export class PortfolioDashboardDto {
  @ApiProperty()
  activeCredits: number;

  @ApiProperty()
  activePortfolioValue: number;

  @ApiProperty()
  overdueInstallmentsCount: number;

  @ApiProperty()
  overduePortfolioValue: number;
}
