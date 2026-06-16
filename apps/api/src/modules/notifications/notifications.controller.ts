import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  getNotifications(@Query('userId') userId: string) {
    // In real app, userId comes from JWT
    return this.notificationsService.getNotifications(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@Query('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@Query('userId') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }
}
