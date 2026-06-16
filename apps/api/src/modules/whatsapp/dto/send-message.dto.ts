import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
}

export class SendMessageDto {
  @ApiProperty({ description: 'The phone number to send the message to (with country code)' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'The body of the message' })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiProperty({ enum: MessageType, description: 'The type of the message', default: MessageType.TEXT })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.TEXT;

  @ApiProperty({ description: 'URL of the media if type is not text', required: false })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiProperty({ description: 'File name of the media', required: false })
  @IsString()
  @IsOptional()
  fileName?: string;
}
