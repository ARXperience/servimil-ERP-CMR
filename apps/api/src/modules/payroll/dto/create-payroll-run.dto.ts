import { IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePayrollRunDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;
}
