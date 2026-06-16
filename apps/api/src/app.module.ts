import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { FinanceModule } from './modules/finance/finance.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { CreditModule } from './modules/credit/credit.module';
import { CrmModule } from './modules/crm/crm.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { LegalModule } from './modules/legal/legal.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AiModule } from './modules/ai/ai.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AdminModule } from './modules/admin/admin.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { QueuesModule } from './queues/queues.module';
import { EventsModule } from './events/events.module';
import { AiHubModule } from './modules/ai-hub/ai-hub.module';
import { EmailIntegrationModule } from './modules/email-integration/email-integration.module';
import { ContentStudioModule } from './modules/content-studio/content-studio.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('RATE_LIMIT_TTL', 60000),
          limit: config.get('RATE_LIMIT_MAX', 100),
        },
      ],
    }),

    // Event emitter
    EventEmitterModule.forRoot({ wildcard: true, maxListeners: 20 }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD') || undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
    }),

    // Core
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ClientsModule,
    FinanceModule,
    PayrollModule,
    CreditModule,
    CrmModule,
    WhatsappModule,
    LegalModule,
    DocumentsModule,
    AiModule,
    ReportsModule,
    NotificationsModule,
    WebhooksModule,
    AdminModule,

    // Infrastructure
    WebsocketsModule,
    QueuesModule,
    EventsModule,
    AiHubModule,
    EmailIntegrationModule,
    ContentStudioModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
