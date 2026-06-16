import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OcrService } from './ocr/ocr.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ocrService: OcrService,
    @InjectQueue('ocr-queue') private ocrQueue: Queue,
  ) {}

  async uploadDocument(file: Express.Multer.File, title?: string, entityType?: string, entityId?: string) {
    const document = await this.prisma.document.create({
      data: {
        name: title || file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        storageKey: file.filename,
      } as any,
    });

    return document;
  }

  async getDocuments(folderId?: string, clientId?: string) {
    const where: any = {};
    if (folderId) where.folderId = folderId;
    if (clientId) where.clientId = clientId;
    return this.prisma.document.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getDocument(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async deleteDocument(id: string) {
    const doc = await this.getDocument(id);
    
    // Delete file
    const filePath = path.join(process.cwd(), 'uploads', doc.storageKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return this.prisma.document.delete({ where: { id } });
  }

  async triggerOcr(id: string) {
    const doc = await this.getDocument(id);
    
    // Add to BullMQ queue instead of processing synchronously
    await this.ocrQueue.add('process-ocr', {
      documentId: id,
      filePath: path.join(process.cwd(), 'uploads', doc.storageKey),
    });

    return { message: 'OCR process queued' };
  }

  async getOcrResult(id: string) {
    const doc = await this.getDocument(id);
    return {
      status: doc.isProcessed ? 'COMPLETED' : 'PENDING',
      extractedText: (doc as any).extractedText,
      structuredData: (doc as any).structuredData,
    };
  }
}
