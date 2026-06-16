import { IsString, IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EventType {
  HEARING = 'HEARING',
  DEADLINE = 'DEADLINE',
  MEETING = 'MEETING',
  FILING = 'FILING',
  OTHER = 'OTHER',
}

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty()
  @IsString()
  caseId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  reminderEnabled?: boolean;
}
