import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationFilterDto } from './dto/conversation-filter.dto';
import { CreateTemplateDto } from './dto/create-template.dto';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Get all WhatsApp sessions' })
  getSessions() {
    return this.whatsappService.getSessions();
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new WhatsApp session' })
  createSession(@Body() createSessionDto: CreateSessionDto) {
    return this.whatsappService.createSession(createSessionDto);
  }

  @Get('sessions/:id/qr')
  @ApiOperation({ summary: 'Get QR code for session' })
  getQr(@Param('id') id: string) {
    return this.whatsappService.getQr(id);
  }

  @Post('sessions/:id/disconnect')
  @ApiOperation({ summary: 'Disconnect a WhatsApp session' })
  disconnectSession(@Param('id') id: string) {
    return this.whatsappService.disconnectSession(id);
  }

  @Patch('sessions/:id/config')
  @ApiOperation({ summary: 'Update WhatsApp session configuration (AI bot settings)' })
  updateSessionConfig(@Param('id') id: string, @Body() configData: any) {
    return this.whatsappService.updateSessionConfig(id, configData);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete a WhatsApp session' })
  deleteSession(@Param('id') id: string) {
    return this.whatsappService.deleteSession(id);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get WhatsApp conversations' })
  getConversations(@Query() query: ConversationFilterDto) {
    return this.whatsappService.getConversations(query);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a specific conversation' })
  getConversation(@Param('id') id: string) {
    return this.whatsappService.getConversation(id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  getMessages(@Param('id') id: string) {
    return this.whatsappService.getMessages(id);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  sendMessage(@Param('id') id: string, @Body() sendMessageDto: SendMessageDto) {
    return this.whatsappService.sendMessage(id, sendMessageDto);
  }

  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Update conversation details (tags, assignment)' })
  updateConversation(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.whatsappService.updateConversation(id, updateConversationDto);
  }

  @Get('conversations/:id/copilot')
  @ApiOperation({ summary: 'Get AI copilot data for a conversation (summary, client data, suggested actions)' })
  getCopilot(@Param('id') id: string) {
    return this.whatsappService.getCopilotData(id);
  }

  @Get('conversations/:id/client-profile')
  @ApiOperation({ summary: 'Get CRM client profile linked to a WhatsApp conversation' })
  getClientProfile(@Param('id') id: string) {
    return this.whatsappService.getClientProfile(id);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get WhatsApp templates' })
  getTemplates() {
    return this.whatsappService.getTemplates();
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a WhatsApp template' })
  createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    return this.whatsappService.createTemplate(createTemplateDto);
  }
}

