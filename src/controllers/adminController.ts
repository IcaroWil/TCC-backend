import { Response } from 'express';
import { PrismaClient, UserRole, AppointmentStatus } from '@prisma/client';
import { AuthenticatedRequest, DashboardStats, UpdateBusinessHoursDTO, CreateHolidayDTO } from '@/types';
import { sendSuccess, sendError, sendNotFound, calculatePagination, sendSuccessWithPagination } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const prisma = new PrismaClient();

class AdminController {
  /**
   * Dashboard - estatísticas gerais
   */
  getDashboardStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // Segunda-feira
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
    const startOfThisMonth = startOfMonth(today);
    const endOfThisMonth = endOfMonth(today);

    // Contadores básicos
    const [
      totalAppointments,
      todayAppointments,
      weekAppointments,
      monthAppointments,
      totalClients,
      totalServices,
    ] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
          status: { not: AppointmentStatus.CANCELLED },
        },
      }),
      prisma.appointment.count({
        where: {
          date: { gte: startOfThisWeek, lte: endOfThisWeek },
          status: { not: AppointmentStatus.CANCELLED },
        },
      }),
      prisma.appointment.count({
        where: {
          date: { gte: startOfThisMonth, lte: endOfThisMonth },
          status: { not: AppointmentStatus.CANCELLED },
        },
      }),
      prisma.user.count({
        where: { role: UserRole.CLIENT },
      }),
      prisma.service.count({
        where: { isActive: true },
      }),
    ]);

    // Receita (apenas agendamentos concluídos)
    const [todayRevenue, weekRevenue, monthRevenue] = await Promise.all([
      this.calculateRevenue(startOfToday, endOfToday),
      this.calculateRevenue(startOfThisWeek, endOfThisWeek),
      this.calculateRevenue(startOfThisMonth, endOfThisMonth),
    ]);

    // Agendamentos por status
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        date: { gte: startOfThisMonth, lte: endOfThisMonth },
      },
      _count: { id: true },
    });

    const statusCounts = appointmentsByStatus.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Serviços mais populares
    const popularServicesData = await prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        date: { gte: startOfThisMonth, lte: endOfThisMonth },
        status: { not: AppointmentStatus.CANCELLED },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const popularServices = await Promise.all(
      popularServicesData.map(async (item) => {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId },
          select: { id: true, name: true },
        });
        return {
          id: item.serviceId,
          name: service?.name || 'Serviço não encontrado',
          count: item._count.id,
        };
      })
    );

    const stats: DashboardStats = {
      totalAppointments,
      todayAppointments,
      weekAppointments,
      monthAppointments,
      totalClients,
      totalServices,
      revenue: {
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
      },
      appointmentsByStatus: {
        scheduled: statusCounts.scheduled || 0,
        confirmed: statusCounts.confirmed || 0,
        completed: statusCounts.completed || 0,
        cancelled: statusCounts.cancelled || 0,
      },
      popularServices,
    };

    return sendSuccess(res, stats, 'Estatísticas do dashboard obtidas com sucesso');
  });

  /**
   * Gerenciar usuários
   */
  getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, role, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const { offset } = calculatePagination(pageNum, limitNum, 0);

    const where: any = {};
    
    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      skip: offset,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    const pagination = calculatePagination(pageNum, limitNum, total);

    return sendSuccessWithPagination(
      res,
      users,
      pagination,
      'Usuários obtidos com sucesso'
    );
  });

  /**
   * Atualizar role do usuário
   */
  updateUserRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(UserRole).includes(role)) {
      return sendError(res, 'Role inválido');
    }

    // Não permitir alterar o próprio role
    if (req.user?.id === id) {
      return sendError(res, 'Não é possível alterar seu próprio nível de acesso');
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return sendNotFound(res, 'Usuário não encontrado');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, updatedUser, 'Role do usuário atualizado com sucesso');
  });

  /**
   * Gerenciar horários de funcionamento
   */
  getBusinessHours = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const businessHours = await prisma.businessHours.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });

    // Mapear dias da semana
    const daysOfWeek = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];

    const formattedHours = businessHours.map(hour => ({
      ...hour,
      dayName: daysOfWeek[hour.dayOfWeek],
    }));

    return sendSuccess(res, formattedHours, 'Horários de funcionamento obtidos com sucesso');
  });

  /**
   * Atualizar horário de funcionamento
   */
  updateBusinessHours = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { dayOfWeek } = req.params;
    const { startTime, endTime, isActive }: UpdateBusinessHoursDTO = req.validatedData;

    const dayNum = parseInt(dayOfWeek);
    if (dayNum < 0 || dayNum > 6) {
      return sendError(res, 'Dia da semana inválido (0-6)');
    }

    const businessHour = await prisma.businessHours.upsert({
      where: { dayOfWeek: dayNum },
      update: {
        startTime,
        endTime,
        isActive,
      },
      create: {
        dayOfWeek: dayNum,
        startTime,
        endTime,
        isActive,
      },
    });

    return sendSuccess(res, businessHour, 'Horário de funcionamento atualizado com sucesso');
  });

  /**
   * Gerenciar feriados
   */
  getHolidays = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { year } = req.query;
    
    const where: any = {};
    if (year) {
      const yearNum = parseInt(year as string);
      where.date = {
        gte: new Date(`${yearNum}-01-01`),
        lte: new Date(`${yearNum}-12-31`),
      };
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return sendSuccess(res, holidays, 'Feriados obtidos com sucesso');
  });

  /**
   * Criar feriado
   */
  createHoliday = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { date, name, description, isRecurring }: CreateHolidayDTO = req.validatedData;

    const holiday = await prisma.holiday.create({
      data: {
        date: parseISO(date),
        name,
        description,
        isRecurring: isRecurring || false,
      },
    });

    return sendSuccess(res, holiday, 'Feriado criado com sucesso', 201);
  });

  /**
   * Excluir feriado
   */
  deleteHoliday = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const holiday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      return sendNotFound(res, 'Feriado não encontrado');
    }

    await prisma.holiday.delete({
      where: { id },
    });

    return sendSuccess(res, null, 'Feriado excluído com sucesso');
  });

  /**
   * Gerenciar configurações do sistema
   */
  getSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const settings = await prisma.settings.findMany({
      orderBy: { key: 'asc' },
    });

    // Organizar em objeto para facilitar uso
    const settingsObject = settings.reduce((acc, setting) => {
      let value: any = setting.value;
      
      // Converter tipos
      switch (setting.type) {
        case 'number':
          value = parseFloat(setting.value);
          break;
        case 'boolean':
          value = setting.value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(setting.value);
          } catch (e) {
            value = setting.value;
          }
          break;
      }

      acc[setting.key] = {
        value,
        type: setting.type,
        updatedAt: setting.updatedAt,
      };
      
      return acc;
    }, {} as Record<string, any>);

    return sendSuccess(res, {
      settings: settingsObject,
      raw: settings,
    }, 'Configurações obtidas com sucesso');
  });

  /**
   * Atualizar configuração
   */
  updateSetting = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { key } = req.params;
    const { value, type = 'string' } = req.body;

    if (value === undefined) {
      return sendError(res, 'Valor é obrigatório');
    }

    // Validar tipo
    let stringValue: string;
    switch (type) {
      case 'number':
        if (isNaN(parseFloat(value))) {
          return sendError(res, 'Valor deve ser um número válido');
        }
        stringValue = value.toString();
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return sendError(res, 'Valor deve ser verdadeiro ou falso');
        }
        stringValue = value.toString();
        break;
      case 'json':
        try {
          JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
          stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        } catch (e) {
          return sendError(res, 'Valor deve ser um JSON válido');
        }
        break;
      default:
        stringValue = value.toString();
    }

    const setting = await prisma.settings.upsert({
      where: { key },
      update: {
        value: stringValue,
        type,
      },
      create: {
        key,
        value: stringValue,
        type,
      },
    });

    return sendSuccess(res, setting, 'Configuração atualizada com sucesso');
  });

  /**
   * Calcular receita para um período
   */
  private async calculateRevenue(startDate: Date, endDate: Date): Promise<number> {
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: AppointmentStatus.COMPLETED,
      },
      include: {
        service: {
          select: { price: true },
        },
      },
    });

    return completedAppointments.reduce((total, appointment) => {
      return total + (appointment.service.price || 0);
    }, 0);
  }
}

export default new AdminController();