import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadFilterDto } from './dto/lead-filter.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('CRM')
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get CRM dashboard data' })
  getDashboard() {
    return this.crmService.getDashboard();
  }

  @Post('leads')
  @ApiOperation({ summary: 'Create a new lead' })
  createLead(@Body() createLeadDto: CreateLeadDto) {
    return this.crmService.createLead(createLeadDto);
  }

  @Get('leads')
  @ApiOperation({ summary: 'Get all leads' })
  findAllLeads(@Query() filterDto: LeadFilterDto) {
    return this.crmService.findAllLeads(filterDto);
  }

  @Patch('leads/:id')
  @ApiOperation({ summary: 'Update a lead' })
  updateLead(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.crmService.updateLead(id, updateLeadDto);
  }

  @Delete('leads/:id')
  @ApiOperation({ summary: 'Delete a lead' })
  removeLead(@Param('id') id: string) {
    return this.crmService.removeLead(id);
  }

  @Patch('leads/:id/status')
  @ApiOperation({ summary: 'Update lead status' })
  updateLeadStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.crmService.updateLeadStatus(id, status);
  }

  @Post('leads/:id/assign')
  @ApiOperation({ summary: 'Assign lead to user' })
  assignLead(@Param('id') id: string, @Body('assignedToId') assignedToId: string) {
    return this.crmService.assignLead(id, assignedToId);
  }

  @Post('activities')
  @ApiOperation({ summary: 'Create a new CRM activity' })
  createActivity(@Body() createActivityDto: CreateActivityDto) {
    return this.crmService.createActivity(createActivityDto);
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get all activities' })
  findAllActivities() {
    return this.crmService.findAllActivities();
  }

  @Patch('activities/:id')
  @ApiOperation({ summary: 'Update an activity' })
  updateActivity(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
    return this.crmService.updateActivity(id, updateActivityDto);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get pipeline view data' })
  getPipeline() {
    return this.crmService.getPipeline();
  }

  @Post('automations')
  @ApiOperation({ summary: 'Create an automation rule' })
  createAutomation(@Body() createAutomationDto: CreateAutomationDto) {
    return this.crmService.createAutomation(createAutomationDto);
  }

  @Get('automations')
  @ApiOperation({ summary: 'Get all automations' })
  findAllAutomations() {
    return this.crmService.findAllAutomations();
  }

  @Patch('automations/:id')
  @ApiOperation({ summary: 'Update an automation' })
  updateAutomation(@Param('id') id: string, @Body() data: any) {
    return this.crmService.updateAutomation(id, data);
  }
}
