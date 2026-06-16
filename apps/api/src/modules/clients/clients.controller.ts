import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { SearchClientDto } from './dto/search-client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';

class ClientResponseDto {
  id: string;
  document: string;
  firstName: string;
  lastName: string;
}

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.ADVISOR)
  @ApiOperation({ summary: 'Create a new client' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.ADVISOR)
  @ApiOperation({ summary: 'Search and filter clients with pagination' })
  @ApiPaginatedResponse(ClientResponseDto)
  findAll(@Query() searchDto: SearchClientDto) {
    return this.clientsService.findAll(searchDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.ADVISOR)
  @ApiOperation({ summary: 'Get client by id' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Update client' })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete client' })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
