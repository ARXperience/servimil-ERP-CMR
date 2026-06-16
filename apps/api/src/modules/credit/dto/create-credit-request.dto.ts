import { IsNumber, IsUUID, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCreditRequestDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNumber()
  term: number; // in months

  @ApiProperty()
  @IsNumber()
  interestRate: number; // monthly percentage
}
