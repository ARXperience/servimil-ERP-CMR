import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty()
  @IsObject()
  components: any;
}
