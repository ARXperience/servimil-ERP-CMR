import { IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayInstallmentDto {
  @ApiProperty()
  @IsNumber()
  amountPaid: number;

  @ApiProperty()
  @IsDateString()
  paidDate: string;
}
