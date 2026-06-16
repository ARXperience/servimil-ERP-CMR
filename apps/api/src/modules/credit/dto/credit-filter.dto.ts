import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreditFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['DRAFT', 'REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAID_OFF'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
