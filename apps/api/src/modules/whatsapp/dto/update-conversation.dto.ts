import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ConversationStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PENDING = 'PENDING',
}

export class UpdateConversationDto {
  @ApiProperty({ enum: ConversationStatus, required: false })
  @IsEnum(ConversationStatus)
  @IsOptional()
  status?: ConversationStatus;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  funnelStage?: string;
}
