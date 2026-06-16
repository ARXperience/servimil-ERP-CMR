import { IsOptional, IsDateString, IsEnum, IsUUID, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, TransactionStatus } from '@prisma/client';

export class TransactionFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: ['INCOME', 'EXPENSE', 'TRANSFER'] })
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE', 'TRANSFER'])
  type?: TransactionType;

  @ApiPropertyOptional({ enum: ['PENDING', 'COMPLETED', 'FAILED', 'RECONCILED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'COMPLETED', 'FAILED', 'RECONCILED'])
  status?: TransactionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  minAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  maxAmount?: number;
}
