import { IsString, IsObject, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAutomationDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  trigger: string;

  @ApiProperty()
  @IsObject()
  conditions: Record<string, any>;

  @ApiProperty()
  @IsObject()
  action: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
