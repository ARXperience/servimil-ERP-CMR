import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: string;
}
