import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiHubService } from './ai-hub.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('AI Hub')
@Controller('ai-hub')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AiHubController {
  constructor(
    private readonly aiHubService: AiHubService,
    private readonly orchestratorService: AiOrchestratorService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send a message to the AI Hub' })
  async chat(@Req() req: any, @Body() body: { message: string, conversationId?: string, audioBase64?: string, mimeType?: string }) {
    return this.orchestratorService.handleUserMessage(req.user.id, body.message, body.conversationId, body.audioBase64, body.mimeType);
  }

  @Post('execute')
  @ApiOperation({ summary: 'Execute a direct AI tool action without chat' })
  async executeAction(@Req() req: any, @Body() body: { toolName: string; params: any }) {
    return this.orchestratorService.executeDirectAction(req.user.id, body.toolName, body.params);
  }

  @Post('confirm-action/:id')
  @ApiOperation({ summary: 'Confirm a sensitive AI action' })
  async confirmAction(@Req() req: any, @Param('id') confirmationId: string, @Body() body: { confirmed: boolean }) {
    return this.orchestratorService.handleActionConfirmation(req.user.id, confirmationId, body.confirmed);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get recent AI conversations for user' })
  async getConversations(@Req() req: any) {
    return this.aiHubService.getConversations(req.user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get details of a specific conversation' })
  async getConversationDetails(@Req() req: any, @Param('id') id: string) {
    return this.aiHubService.getConversationDetails(req.user.id, id);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get AI execution logs (Admin/Supervisor only)' })
  async getLogs(@Req() req: any) {
    return this.aiHubService.getExecutionLogs(req.user.id);
  }

  @Get('tools')
  @ApiOperation({ summary: 'List available AI tools for current user' })
  async getTools(@Req() req: any) {
    return this.aiHubService.getAvailableTools(req.user.id);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get AI Hub settings' })
  async getSettings() {
    return this.aiHubService.getSettings();
  }
}
