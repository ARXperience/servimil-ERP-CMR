import { Controller, Get, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get system audit logs' })
  getAuditLogs(@Query() filters: any) {
    return this.adminService.getAuditLogs(filters);
  }

  @Get('system-config')
  @ApiOperation({ summary: 'Get all system configurations' })
  getSystemConfig() {
    return this.adminService.getSystemConfig();
  }

  @Put('system-config/:key')
  @ApiOperation({ summary: 'Update a system configuration' })
  updateSystemConfig(@Param('key') key: string, @Body('value') value: any) {
    return this.adminService.updateSystemConfig(key, value);
  }

  @Get('health')
  @ApiOperation({ summary: 'System health check' })
  getHealth() {
    return this.adminService.getHealth();
  }

  @Get('stats')
  @ApiOperation({ summary: 'System technical stats' })
  getStats() {
    return this.adminService.getStats();
  }
}
