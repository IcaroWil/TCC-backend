import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário administrador
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@timelyfy.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@timelyfy.com',
      name: 'Administrador',
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log('✅ Usuário administrador criado:', admin.email);

  // Criar horário de funcionamento padrão (Segunda a Sexta, 8h às 18h)
  const businessDays = [1, 2, 3, 4, 5]; // Segunda a Sexta
  
  for (const day of businessDays) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: day },
      update: {},
      create: {
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '18:00',
        isActive: true,
      },
    });
  }

  console.log('✅ Horários de funcionamento criados');

  // Criar serviços exemplo
  const services = [
    {
      name: 'Consulta Geral',
      description: 'Consulta médica geral com duração de 30 minutos',
      duration: 30,
      price: 150.00,
      color: '#3B82F6',
      category: 'Consultas',
    },
    {
      name: 'Exame de Rotina',
      description: 'Exame médico de rotina com duração de 45 minutos',
      duration: 45,
      price: 200.00,
      color: '#10B981',
      category: 'Exames',
    },
    {
      name: 'Consulta Especializada',
      description: 'Consulta com especialista, duração de 60 minutos',
      duration: 60,
      price: 300.00,
      color: '#F59E0B',
      category: 'Especialidades',
    },
    {
      name: 'Retorno',
      description: 'Consulta de retorno com duração de 20 minutos',
      duration: 20,
      price: 80.00,
      color: '#8B5CF6',
      category: 'Consultas',
    },
  ];

  for (const serviceData of services) {
    await prisma.service.create({
      data: {
        ...serviceData,
        createdBy: admin.id,
      },
    });
  }

  console.log('✅ Serviços exemplo criados');

  // Criar configurações padrão
  const settings = [
    { key: 'business_name', value: 'Timelyfy', type: 'string' },
    { key: 'business_description', value: 'Sistema de Agendamentos Online', type: 'string' },
    { key: 'appointment_buffer_minutes', value: '15', type: 'number' },
    { key: 'max_advance_booking_days', value: '30', type: 'number' },
    { key: 'allow_same_day_booking', value: 'true', type: 'boolean' },
    { key: 'require_phone', value: 'false', type: 'boolean' },
    { key: 'send_confirmation_email', value: 'true', type: 'boolean' },
    { key: 'send_reminder_email', value: 'true', type: 'boolean' },
    { key: 'reminder_hours_before', value: '24', type: 'number' },
    { key: 'timezone', value: 'America/Sao_Paulo', type: 'string' },
  ];

  for (const setting of settings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('✅ Configurações padrão criadas');

  // Criar alguns feriados nacionais brasileiros
  const holidays = [
    { date: new Date('2024-01-01'), name: 'Ano Novo', isRecurring: true },
    { date: new Date('2024-04-21'), name: 'Tiradentes', isRecurring: true },
    { date: new Date('2024-05-01'), name: 'Dia do Trabalhador', isRecurring: true },
    { date: new Date('2024-09-07'), name: 'Independência do Brasil', isRecurring: true },
    { date: new Date('2024-10-12'), name: 'Nossa Senhora Aparecida', isRecurring: true },
    { date: new Date('2024-11-02'), name: 'Finados', isRecurring: true },
    { date: new Date('2024-11-15'), name: 'Proclamação da República', isRecurring: true },
    { date: new Date('2024-12-25'), name: 'Natal', isRecurring: true },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: { date: holiday.date },
      update: {},
      create: holiday,
    });
  }

  console.log('✅ Feriados criados');

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });