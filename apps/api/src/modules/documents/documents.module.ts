import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { OcrService } from './ocr/ocr.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'ocr-queue',
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, OcrService],
  exports: [DocumentsService, OcrService],
})
export class DocumentsModule {}
