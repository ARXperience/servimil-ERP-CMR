import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType, TransactionStatus } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: ['INCOME', 'EXPENSE', 'TRANSFER'] })
  @IsEnum(['INCOME', 'EXPENSE', 'TRANSFER'])
  type: TransactionType;

  @ApiProperty({ enum: ['PENDING', 'COMPLETED', 'FAILED', 'RECONCILED'] })
  @IsEnum(['PENDING', 'COMPLETED', 'FAILED', 'RECONCILED'])
  status: TransactionStatus;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reference?: string;
}
