import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../../prisma/prisma.module';

import { DataImportService } from './data-import.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, DataImportService],
  exports: [ReportsService, DataImportService],
})
export class ReportsModule {}
