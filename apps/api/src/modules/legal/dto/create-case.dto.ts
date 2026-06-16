import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CaseStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
  ON_HOLD = 'ON_HOLD',
}

export enum CasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateCaseDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty({ enum: CaseStatus, default: CaseStatus.OPEN })
  @IsEnum(CaseStatus)
  @IsOptional()
  status?: CaseStatus;

  @ApiProperty({ enum: CasePriority, default: CasePriority.MEDIUM })
  @IsEnum(CasePriority)
  @IsOptional()
  priority?: CasePriority;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  courtName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  caseNumber?: string;
}
