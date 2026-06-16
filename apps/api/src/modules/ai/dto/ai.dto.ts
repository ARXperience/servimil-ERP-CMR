import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ required: false })
  @IsString()
  context?: string;
}

export class SummarizeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class ClassifyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ type: [String] })
  categories: string[];
}
