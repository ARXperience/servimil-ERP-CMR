import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { diskStorage } from 'multer';
import * as path from 'path';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all documents' })
  getDocuments(@Query('folderId') folderId?: string, @Query('clientId') clientId?: string) {
    return this.documentsService.getDocuments(folderId, clientId);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + path.extname(file.originalname));
        },
      }),
    }),
  )
  uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
    @Body('entityType') entityType?: string,
    @Body('entityId') entityId?: string,
  ) {
    return this.documentsService.uploadDocument(file, title, entityType, entityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific document' })
  getDocument(@Param('id') id: string) {
    return this.documentsService.getDocument(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  deleteDocument(@Param('id') id: string) {
    return this.documentsService.deleteDocument(id);
  }

  @Post(':id/ocr')
  @ApiOperation({ summary: 'Trigger OCR on a document' })
  triggerOcr(@Param('id') id: string) {
    return this.documentsService.triggerOcr(id);
  }

  @Get(':id/ocr-result')
  @ApiOperation({ summary: 'Get OCR result' })
  getOcrResult(@Param('id') id: string) {
    return this.documentsService.getOcrResult(id);
  }
}
