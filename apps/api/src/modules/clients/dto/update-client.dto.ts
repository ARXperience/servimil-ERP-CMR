import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: string;
}
