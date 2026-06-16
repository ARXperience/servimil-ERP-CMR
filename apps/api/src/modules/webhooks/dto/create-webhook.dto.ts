import { IsString, IsNotEmpty, IsArray, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  secret?: string;
}
