import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @ApiOperation({ summary: 'Create webhook' })
  create(@Body() dto: CreateWebhookDto) {
    return this.webhooksService.createWebhook(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhooks' })
  findAll() {
    return this.webhooksService.getWebhooks();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a webhook' })
  findOne(@Param('id') id: string) {
    return this.webhooksService.getWebhook(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a webhook' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateWebhookDto>) {
    return this.webhooksService.updateWebhook(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  remove(@Param('id') id: string) {
    return this.webhooksService.deleteWebhook(id);
  }
}
