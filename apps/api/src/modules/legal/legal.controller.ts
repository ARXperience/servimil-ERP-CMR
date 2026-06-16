import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LegalService } from './legal.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CaseFilterDto } from './dto/case-filter.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@ApiTags('legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get legal dashboard statistics' })
  getDashboard() {
    return this.legalService.getDashboard();
  }

  @Post('cases')
  @ApiOperation({ summary: 'Create a new legal case' })
  createCase(@Body() createCaseDto: CreateCaseDto) {
    return this.legalService.createCase(createCaseDto);
  }

  @Get('cases')
  @ApiOperation({ summary: 'Get all legal cases' })
  getCases(@Query() filter: CaseFilterDto) {
    return this.legalService.getCases(filter);
  }

  @Get('cases/:id')
  @ApiOperation({ summary: 'Get a specific case' })
  getCase(@Param('id') id: string) {
    return this.legalService.getCase(id);
  }

  @Patch('cases/:id')
  @ApiOperation({ summary: 'Update a legal case' })
  updateCase(@Param('id') id: string, @Body() updateCaseDto: UpdateCaseDto) {
    return this.legalService.updateCase(id, updateCaseDto);
  }

  @Delete('cases/:id')
  @ApiOperation({ summary: 'Delete a legal case' })
  deleteCase(@Param('id') id: string) {
    return this.legalService.deleteCase(id);
  }

  @Post('events')
  @ApiOperation({ summary: 'Create a calendar event' })
  createEvent(@Body() createEventDto: CreateEventDto) {
    return this.legalService.createEvent(createEventDto);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get calendar events' })
  getEvents() {
    return this.legalService.getEvents();
  }

  @Patch('events/:id')
  @ApiOperation({ summary: 'Update a calendar event' })
  updateEvent(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.legalService.updateEvent(id, updateEventDto);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get events within a date range' })
  getCalendar(@Query() query: CalendarQueryDto) {
    return this.legalService.getCalendar(query);
  }

  @Get('upcoming-deadlines')
  @ApiOperation({ summary: 'Get upcoming deadlines' })
  getUpcomingDeadlines() {
    return this.legalService.getUpcomingDeadlines();
  }
}
