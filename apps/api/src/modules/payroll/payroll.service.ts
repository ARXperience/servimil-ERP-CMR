import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { CreateNoveltyDto } from './dto/create-novelty.dto';

// Colombian Payroll Constants
const SMLV = 1300000; // Salario Minimo Legal Vigente (example 2024)
const AUXILIO_TRANSPORTE = 162000; // Auxilio Transporte (example 2024)

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const employeesCount = await this.prisma.employee.count();
    const runs = await this.prisma.payroll.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    return {
      activeEmployees: employeesCount,
      recentRuns: runs,
      totalPayrollExpenses: runs.reduce((acc: number, run) => acc + Number(run.totalNet || 0), 0)
    };
  }

  async createEmployee(data: CreateEmployeeDto) {
    return this.prisma.employee.create({ data: data as any });
  }

  async findAllEmployees() {
    return this.prisma.employee.findMany({
      include: { department: true, position: true }
    });
  }

  async updateEmployee(id: string, data: UpdateEmployeeDto) {
    return this.prisma.employee.update({
      where: { id },
      data: data as any
    });
  }

  async createPayrollRun(data: CreatePayrollRunDto) {
    return this.prisma.payroll.create({
      data: {
        period: (data as any).period || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        periodType: (data as any).periodType || 'monthly',
        status: 'DRAFT',
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        totalEmployees: 0,
      } as any
    });
  }

  async findAllPayrollRuns() {
    return this.prisma.payroll.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOnePayrollRun(id: string) {
    return this.prisma.payroll.findUnique({
      where: { id },
      include: { items: true }
    });
  }

  async calculatePayrollRun(id: string) {
    const run = await this.prisma.payroll.findUnique({ where: { id } });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (run.status !== 'DRAFT') throw new BadRequestException('Can only calculate DRAFT runs');

    const employees = await this.prisma.employee.findMany({ where: { status: 'ACTIVE' } as any });
    const novelties = await this.prisma.payrollNovelty.findMany({
      where: {
        period: run.period,
        isApproved: true,
      }
    });

    let runTotal = 0;
    
    // Process each employee
    for (const emp of employees) {
      const baseSalary = Number(emp.baseSalary);
      
      // Auxilio Transporte (if < 2 SMLV)
      const hasAuxTrans = baseSalary <= (SMLV * 2);
      const auxTransporte = hasAuxTrans ? AUXILIO_TRANSPORTE : 0;
      
      const empNovelties = novelties.filter(n => n.employeeId === emp.id);
      
      let additions = 0;
      let deductions = 0;

      empNovelties.forEach(n => {
        if (n.type === 'bonus' || n.type === 'extra_hours') additions += Number(n.amount || 0);
        if (n.type === 'deduction' || n.type === 'absence') deductions += Number(n.amount || 0);
      });

      const totalBase = baseSalary + additions;
      
      // Employee Deductions (Health 4%, Pension 4%)
      const healthDeduction = totalBase * 0.04;
      const pensionDeduction = totalBase * 0.04;

      const grossPay = totalBase + auxTransporte;
      const totalDeductionsAmt = healthDeduction + pensionDeduction + deductions;
      const netPay = grossPay - totalDeductionsAmt;

      // Employer Contributions
      const employerHealth = totalBase * 0.085;
      const employerPension = totalBase * 0.12;
      const arl = totalBase * 0.00522; // Risk 1 example
      
      // Prestaciones sociales
      const basePrestaciones = totalBase + auxTransporte;
      const cesantias = basePrestaciones * 0.0833;
      const intCesantias = cesantias * 0.12;
      const prima = basePrestaciones * 0.0833;
      const vacaciones = totalBase * 0.0417;

      await this.prisma.payrollItem.create({
        data: {
          payrollId: id,
          employeeId: emp.id,
          baseSalary,
          transportAllowance: auxTransporte,
          healthEmployee: healthDeduction,
          pensionEmployee: pensionDeduction,
          healthEmployer: employerHealth,
          pensionEmployer: employerPension,
          arlEmployer: arl,
          grossSalary: grossPay,
          totalDeductions: totalDeductionsAmt,
          netSalary: netPay,
          cesantias,
          interestCesantias: intCesantias,
          prima,
          vacaciones,
        } as any
      });

      runTotal += netPay;
    }

    await this.prisma.payroll.update({
      where: { id },
      data: { status: 'CALCULATED', totalNet: runTotal } as any
    });

    return { message: 'Payroll run calculated successfully', totalAmount: runTotal };
  }

  async approvePayrollRun(id: string) {
    return this.prisma.payroll.update({
      where: { id },
      data: { status: 'APPROVED' } as any
    });
  }

  async createNovelty(data: CreateNoveltyDto) {
    return this.prisma.payrollNovelty.create({ data: data as any });
  }

  async findAllNovelties() {
    return this.prisma.payrollNovelty.findMany({ include: { employee: true } });
  }

  async createDepartment(data: any) {
    return this.prisma.department.create({ data });
  }
  
  async findAllDepartments() {
    return this.prisma.department.findMany();
  }

  async createPosition(data: any) {
    return this.prisma.position.create({ data });
  }
  
  async findAllPositions() {
    return this.prisma.position.findMany();
  }
}
