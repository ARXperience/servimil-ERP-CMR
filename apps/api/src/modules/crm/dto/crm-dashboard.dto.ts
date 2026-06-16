import { ApiProperty } from '@nestjs/swagger';

export class CrmDashboardDto {
  @ApiProperty()
  totalLeads: number;

  @ApiProperty()
  totalPipelineValue: number;

  @ApiProperty()
  pendingActivities: number;

  @ApiProperty()
  funnel: any[];
}
