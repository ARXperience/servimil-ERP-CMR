import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsString()
  documentId: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNumber()
  baseSalary: number;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status?: string;

  @ApiProperty()
  @IsUUID()
  departmentId: string;

  @ApiProperty()
  @IsUUID()
  positionId: string;
}
