import { IsString, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCollectionActionDto {
  @ApiProperty()
  @IsUUID()
  creditId: string;

  @ApiProperty({ enum: ['CALL', 'EMAIL', 'VISIT', 'LEGAL'] })
  @IsEnum(['CALL', 'EMAIL', 'VISIT', 'LEGAL'])
  type: string;

  @ApiProperty()
  @IsString()
  notes: string;

  @ApiProperty()
  @IsDateString()
  date: string;
}
