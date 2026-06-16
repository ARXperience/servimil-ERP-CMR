import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OcrService } from '../../modules/documents/ocr/ocr.service';

@Processor('ocr-queue')
export class OcrProcessor extends WorkerHost {
  constructor(private readonly ocrService: OcrService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { documentId, filePath } = job.data;
    console.log(`Processing OCR for document ${documentId}`);
    return this.ocrService.processDocument(documentId, filePath);
  }
}
