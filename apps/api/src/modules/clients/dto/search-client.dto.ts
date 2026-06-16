import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SearchClientDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name, document, email, or phone' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  documentType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
