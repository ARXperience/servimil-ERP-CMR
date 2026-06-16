import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ConversationFilterDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  hasUnread?: boolean;
}
