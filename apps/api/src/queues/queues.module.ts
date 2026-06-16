import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OcrProcessor } from './processors/ocr.processor';
import { DocumentsModule } from '../modules/documents/documents.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'ocr-queue',
    }),
    DocumentsModule,
  ],
  providers: [OcrProcessor],
})
export class QueuesModule {}
