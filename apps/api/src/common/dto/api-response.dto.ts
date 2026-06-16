import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty()
  timestamp: string;
}
