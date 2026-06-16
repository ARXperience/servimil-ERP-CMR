import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalendarQueryDto {
  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
