import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CaseStatus, CasePriority } from './create-case.dto';

export class CaseFilterDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ enum: CaseStatus, required: false })
  @IsEnum(CaseStatus)
  @IsOptional()
  status?: CaseStatus;

  @ApiProperty({ enum: CasePriority, required: false })
  @IsEnum(CasePriority)
  @IsOptional()
  priority?: CasePriority;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  assignedToId?: string;
}
