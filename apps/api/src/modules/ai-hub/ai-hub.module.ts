import { Module } from '@nestjs/common';
import { AiHubController } from './ai-hub.controller';
import { AiHubService } from './ai-hub.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiToolsService } from './ai-tools.service';
import { AiMemoryService } from './ai-memory.service';
import { AiPermissionsService } from './ai-permissions.service';
import { AiExecutionService } from './ai-execution.service';
import { AiLogsService } from './ai-logs.service';
import { AiContextService } from './ai-context.service';
import { AiRouterService } from './ai-router.service';

import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiHubController],
  providers: [
    AiHubService,
    AiOrchestratorService,
    AiToolsService,
    AiMemoryService,
    AiPermissionsService,
    AiExecutionService,
    AiLogsService,
    AiContextService,
    AiRouterService,
  ],
  exports: [
    AiHubService,
    AiOrchestratorService,
  ],
})
export class AiHubModule {}
