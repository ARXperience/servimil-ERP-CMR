import { Injectable } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class OcrService {
  constructor(private readonly prisma: PrismaService) {}

  async processDocument(documentId: string, filePath: string) {
    try {
      // Basic OCR with Tesseract
      const { data: { text } } = await Tesseract.recognize(
        filePath,
        'spa', // assuming Spanish for Servimil
        { logger: m => console.log(m) }
      );

      // Extract basic structured data (Example regexes)
      const structuredData = this.extractData(text);

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          isProcessed: true,
          ocrResult: {
            create: {
              provider: 'tesseract',
              status: 'COMPLETED',
              rawText: text,
              structuredData: structuredData as any,
            }
          }
        } as any,
      });

      return { text, structuredData };
    } catch (error) {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { 
          ocrResult: {
            create: {
              provider: 'tesseract',
              status: 'FAILED',
            }
          }
         } as any,
      });
      throw error;
    }
  }

  private extractData(text: string) {
    const data: any = {};
    
    // Example: Extract ID number (Cedula/DNI)
    const idMatch = text.match(/\b\d{10}\b/);
    if (idMatch) data.idNumber = idMatch[0];

    // Example: Extract simple date
    const dateMatch = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
    if (dateMatch) data.date = dateMatch[0];

    return data;
  }
}
