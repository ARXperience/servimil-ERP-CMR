import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ description: 'The name of the session to create' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Optional description of the session', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Make this session the default one', required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: 'The ID of the user creating the session', required: false })
  @IsString()
  @IsOptional()
  userId?: string;
}

