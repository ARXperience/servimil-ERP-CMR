import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';

class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiPaginatedResponse(UserResponseDto)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Get user by id' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete user (Admin only)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle user status (Admin only)' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.usersService.updateStatus(id, status);
  }
}
