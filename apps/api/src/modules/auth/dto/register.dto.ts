import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@servimil.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.ADVISOR })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.ADVISOR;
}
