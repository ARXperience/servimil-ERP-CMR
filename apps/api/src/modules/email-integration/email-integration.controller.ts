import { Controller, Get, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Email Integration')
@Controller('email-integration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailIntegrationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated processed emails' })
  async getEmails(@Query('importantOnly') importantOnly?: string, @Query('limit') limit: string = '50') {
    const where = importantOnly === 'true' ? { isImportant: true } : {};
    return this.prisma.executiveEmail.findMany({
      where,
      orderBy: { date: 'desc' },
      take: parseInt(limit) || 50,
    });
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get processed executive email alerts' })
  async getAlerts() {
    return this.prisma.executiveEmail.findMany({
      orderBy: { date: 'desc' },
      take: 20,
    });
  }

  @Patch('alerts/:id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  async markAsRead(@Param('id') id: string) {
    return this.prisma.executiveEmail.update({
      where: { id },
      data: { isRead: true }
    });
  }
}
