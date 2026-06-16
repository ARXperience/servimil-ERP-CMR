import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  balance: number;

  @ApiProperty({ enum: ['BANK', 'CASH', 'CREDIT'] })
  @IsEnum(['BANK', 'CASH', 'CREDIT'])
  type: 'BANK' | 'CASH' | 'CREDIT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;
}
