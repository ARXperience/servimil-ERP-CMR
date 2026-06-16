import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { CreateNoveltyDto } from './dto/create-novelty.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payroll')
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get payroll dashboard data' })
  getDashboard() {
    return this.payrollService.getDashboard();
  }

  @Post('employees')
  @ApiOperation({ summary: 'Create a new employee' })
  createEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.payrollService.createEmployee(createEmployeeDto);
  }

  @Get('employees')
  @ApiOperation({ summary: 'Get all employees' })
  findAllEmployees() {
    return this.payrollService.findAllEmployees();
  }

  @Patch('employees/:id')
  @ApiOperation({ summary: 'Update an employee' })
  updateEmployee(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.payrollService.updateEmployee(id, updateEmployeeDto);
  }

  @Post('runs')
  @ApiOperation({ summary: 'Create a new payroll run' })
  createPayrollRun(@Body() createPayrollRunDto: CreatePayrollRunDto) {
    return this.payrollService.createPayrollRun(createPayrollRunDto);
  }

  @Get('runs')
  @ApiOperation({ summary: 'Get all payroll runs' })
  findAllPayrollRuns() {
    return this.payrollService.findAllPayrollRuns();
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Get payroll run by id' })
  findOnePayrollRun(@Param('id') id: string) {
    return this.payrollService.findOnePayrollRun(id);
  }

  @Post('runs/:id/calculate')
  @ApiOperation({ summary: 'Calculate payroll run' })
  calculatePayrollRun(@Param('id') id: string) {
    return this.payrollService.calculatePayrollRun(id);
  }

  @Post('runs/:id/approve')
  @ApiOperation({ summary: 'Approve payroll run' })
  approvePayrollRun(@Param('id') id: string) {
    return this.payrollService.approvePayrollRun(id);
  }

  @Post('novelties')
  @ApiOperation({ summary: 'Create a payroll novelty' })
  createNovelty(@Body() createNoveltyDto: CreateNoveltyDto) {
    return this.payrollService.createNovelty(createNoveltyDto);
  }

  @Get('novelties')
  @ApiOperation({ summary: 'Get all payroll novelties' })
  findAllNovelties() {
    return this.payrollService.findAllNovelties();
  }

  @Post('departments')
  @ApiOperation({ summary: 'Create a department' })
  createDepartment(@Body() data: any) {
    return this.payrollService.createDepartment(data);
  }

  @Get('departments')
  @ApiOperation({ summary: 'Get all departments' })
  findAllDepartments() {
    return this.payrollService.findAllDepartments();
  }

  @Post('positions')
  @ApiOperation({ summary: 'Create a position' })
  createPosition(@Body() data: any) {
    return this.payrollService.createPosition(data);
  }

  @Get('positions')
  @ApiOperation({ summary: 'Get all positions' })
  findAllPositions() {
    return this.payrollService.findAllPositions();
  }
}
