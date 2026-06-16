import { PrismaClient, UserRole, UserStatus, TransactionType, LeadStatus, LeadSource, CreditType, LegalCaseType, LegalCaseStatus, EventPriority } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SERVIMIL OS database...');

  // ============================
  // Users
  // ============================
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@servimil.com' },
    update: {},
    create: {
      email: 'admin@servimil.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'SERVIMIL',
      phone: '+573001234567',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  const financiera = await prisma.user.upsert({
    where: { email: 'financiera@servimil.com' },
    update: {},
    create: {
      email: 'financiera@servimil.com',
      passwordHash,
      firstName: 'María',
      lastName: 'González',
      phone: '+573009876543',
      role: UserRole.FINANCIAL,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  const juridica = await prisma.user.upsert({
    where: { email: 'juridica@servimil.com' },
    update: {},
    create: {
      email: 'juridica@servimil.com',
      passwordHash,
      firstName: 'Carlos',
      lastName: 'Ramírez',
      phone: '+573005551234',
      role: UserRole.LEGAL,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  const comercial = await prisma.user.upsert({
    where: { email: 'comercial@servimil.com' },
    update: {},
    create: {
      email: 'comercial@servimil.com',
      passwordHash,
      firstName: 'Ana',
      lastName: 'López',
      phone: '+573007778899',
      role: UserRole.COMMERCIAL,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@servimil.com' },
    update: {},
    create: {
      email: 'supervisor@servimil.com',
      passwordHash,
      firstName: 'Pedro',
      lastName: 'Martínez',
      role: UserRole.SUPERVISOR,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  const asesor = await prisma.user.upsert({
    where: { email: 'asesor@servimil.com' },
    update: {},
    create: {
      email: 'asesor@servimil.com',
      passwordHash,
      firstName: 'Laura',
      lastName: 'Díaz',
      role: UserRole.ADVISOR,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  console.log('✅ Users seeded');

  // ============================
  // Financial Categories
  // ============================
  const incomeCategories = [
    { name: 'Ventas de Servicios', code: 'INC-001', type: TransactionType.INCOME },
    { name: 'Comisiones', code: 'INC-002', type: TransactionType.INCOME },
    { name: 'Intereses de Créditos', code: 'INC-003', type: TransactionType.INCOME },
    { name: 'Otros Ingresos', code: 'INC-099', type: TransactionType.INCOME },
  ];

  const expenseCategories = [
    { name: 'Nómina', code: 'EXP-001', type: TransactionType.EXPENSE },
    { name: 'Arriendo', code: 'EXP-002', type: TransactionType.EXPENSE },
    { name: 'Servicios Públicos', code: 'EXP-003', type: TransactionType.EXPENSE },
    { name: 'Marketing', code: 'EXP-004', type: TransactionType.EXPENSE },
    { name: 'Tecnología', code: 'EXP-005', type: TransactionType.EXPENSE },
    { name: 'Gastos Legales', code: 'EXP-006', type: TransactionType.EXPENSE },
    { name: 'Otros Gastos', code: 'EXP-099', type: TransactionType.EXPENSE },
  ];

  for (const cat of [...incomeCategories, ...expenseCategories]) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: { ...cat, isSystem: true },
    });
  }

  console.log('✅ Categories seeded');

  // ============================
  // Accounts
  // ============================
  await prisma.account.upsert({
    where: { code: 'ACC-001' },
    update: {},
    create: {
      name: 'Banco Principal',
      code: 'ACC-001',
      type: 'bank',
      bankName: 'Bancolombia',
      bankAccount: '1234567890',
      initialBalance: 50000000,
      currentBalance: 50000000,
      currency: 'COP',
    },
  });

  await prisma.account.upsert({
    where: { code: 'ACC-002' },
    update: {},
    create: {
      name: 'Caja Menor',
      code: 'ACC-002',
      type: 'cash',
      initialBalance: 2000000,
      currentBalance: 2000000,
      currency: 'COP',
    },
  });

  console.log('✅ Accounts seeded');

  // ============================
  // Sample Clients
  // ============================
  const client1 = await prisma.client.upsert({
    where: { documentNumber: '1001234567' },
    update: {},
    create: {
      documentType: 'CC',
      documentNumber: '1001234567',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
      phone: '+573101234567',
      city: 'Bogotá',
      department: 'Cundinamarca',
      occupation: 'Empresario',
      monthlyIncome: 8000000,
      tags: ['premium', 'referido'],
    },
  });

  const client2 = await prisma.client.upsert({
    where: { documentNumber: '9001234567' },
    update: {},
    create: {
      documentType: 'NIT',
      documentNumber: '9001234567',
      businessName: 'Importaciones ABC S.A.S.',
      email: 'contacto@importacionesabc.com',
      phone: '+573209876543',
      city: 'Medellín',
      department: 'Antioquia',
      tags: ['empresa', 'crédito'],
    },
  });

  console.log('✅ Clients seeded');

  // ============================
  // Departments & Positions
  // ============================
  const deptAdmin = await prisma.department.upsert({
    where: { code: 'DEPT-ADMIN' },
    update: {},
    create: { name: 'Administración', code: 'DEPT-ADMIN' },
  });

  const deptComercial = await prisma.department.upsert({
    where: { code: 'DEPT-COM' },
    update: {},
    create: { name: 'Comercial', code: 'DEPT-COM' },
  });

  const deptJuridica = await prisma.department.upsert({
    where: { code: 'DEPT-JUR' },
    update: {},
    create: { name: 'Jurídica', code: 'DEPT-JUR' },
  });

  await prisma.position.upsert({
    where: { code: 'POS-GER' },
    update: {},
    create: { title: 'Gerente General', code: 'POS-GER', baseSalary: 12000000 },
  });

  await prisma.position.upsert({
    where: { code: 'POS-ASE' },
    update: {},
    create: { title: 'Asesor Comercial', code: 'POS-ASE', baseSalary: 3000000 },
  });

  await prisma.position.upsert({
    where: { code: 'POS-ABO' },
    update: {},
    create: { title: 'Abogado', code: 'POS-ABO', baseSalary: 5000000 },
  });

  console.log('✅ Departments & Positions seeded');

  // ============================
  // System Config
  // ============================
  const configs = [
    { key: 'company.name', value: JSON.stringify('SERVIMIL'), description: 'Company name' },
    { key: 'company.nit', value: JSON.stringify('900123456-7'), description: 'Company NIT' },
    { key: 'payroll.smmlv_2024', value: JSON.stringify(1300000), description: 'SMMLV 2024' },
    { key: 'payroll.transport_allowance_2024', value: JSON.stringify(162000), description: 'Auxilio de transporte 2024' },
    { key: 'payroll.transport_threshold', value: JSON.stringify(2), description: 'Threshold in SMMLV for transport allowance' },
    { key: 'ai.default_provider', value: JSON.stringify('openai'), description: 'Default AI provider' },
    { key: 'whatsapp.max_sessions', value: JSON.stringify(10), description: 'Max WhatsApp sessions' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: {
        key: config.key,
        value: config.value as any,
        description: config.description,
        isPublic: false,
      },
    });
  }

  console.log('✅ System config seeded');
  console.log('\n🎉 SERVIMIL OS database seeded successfully!');
  console.log('\n📋 Default credentials:');
  console.log('   admin@servimil.com / Admin123!');
  console.log('   financiera@servimil.com / Admin123!');
  console.log('   juridica@servimil.com / Admin123!');
  console.log('   comercial@servimil.com / Admin123!');
  console.log('   supervisor@servimil.com / Admin123!');
  console.log('   asesor@servimil.com / Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
