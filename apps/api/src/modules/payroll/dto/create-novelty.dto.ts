import { IsNumber, IsString, IsEnum, IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoveltyDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ enum: ['BONUS', 'DEDUCTION', 'OVERTIME', 'ABSENCE'] })
  @IsEnum(['BONUS', 'DEDUCTION', 'OVERTIME', 'ABSENCE'])
  type: 'BONUS' | 'DEDUCTION' | 'OVERTIME' | 'ABSENCE';

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
