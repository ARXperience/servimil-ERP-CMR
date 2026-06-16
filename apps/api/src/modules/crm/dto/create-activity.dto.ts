import { IsString, IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ enum: ['CALL', 'MEETING', 'EMAIL', 'TASK'] })
  @IsEnum(['CALL', 'MEETING', 'EMAIL', 'TASK'])
  type: string;

  @ApiProperty()
  @IsUUID()
  leadId: string;

  @ApiProperty()
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
