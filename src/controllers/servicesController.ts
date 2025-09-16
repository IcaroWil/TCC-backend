import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, CreateServiceDTO, UpdateServiceDTO } from '@/types';
import { sendSuccess, sendError, sendNotFound, calculatePagination, sendSuccessWithPagination } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';

const prisma = new PrismaClient();

class ServicesController {
  /**
   * Listar todos os serviços (públicos ativos ou todos para admin)
   */
  getServices = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, category, search, active } = req.query;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const { offset } = calculatePagination(pageNum, limitNum, 0);

    // Filtros
    const where: any = {};
    
    // Se não for admin, mostrar apenas serviços ativos
    if (!isAdmin) {
      where.isActive = true;
    } else if (active !== undefined) {
      where.isActive = active === 'true';
    }

    if (category) {
      where.category = { contains: category as string, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Contar total de registros
    const total = await prisma.service.count({ where });

    // Buscar serviços
    const services = await prisma.service.findMany({
      where,
      skip: offset,
      take: limitNum,
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
      services,
      pagination,
      'Serviços obtidos com sucesso'
    );
  });

  /**
   * Obter um serviço específico
   */
  getService = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    const where: any = { id };
    
    // Se não for admin, mostrar apenas serviços ativos
    if (!isAdmin) {
      where.isActive = true;
    }

    const service = await prisma.service.findUnique({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    if (!service) {
      return sendNotFound(res, 'Serviço não encontrado');
    }

    return sendSuccess(res, service, 'Serviço obtido com sucesso');
  });

  /**
   * Criar novo serviço (apenas admin)
   */
  createService = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    const { name, description, duration, price, color, category }: CreateServiceDTO = req.validatedData;

    const service = await prisma.service.create({
      data: {
        name,
        description,
        duration,
        price,
        color,
        category,
        createdBy: req.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sendSuccess(res, service, 'Serviço criado com sucesso', 201);
  });

  /**
   * Atualizar serviço (apenas admin)
   */
  updateService = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateServiceDTO = req.validatedData;

    // Verificar se o serviço existe
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return sendNotFound(res, 'Serviço não encontrado');
    }

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    return sendSuccess(res, service, 'Serviço atualizado com sucesso');
  });

  /**
   * Excluir serviço (apenas admin)
   */
  deleteService = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Verificar se o serviço existe
    const existingService = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            appointments: {
              where: {
                status: {
                  in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
                },
              },
            },
          },
        },
      },
    });

    if (!existingService) {
      return sendNotFound(res, 'Serviço não encontrado');
    }

    // Verificar se há agendamentos ativos
    if (existingService._count.appointments > 0) {
      return sendError(
        res,
        'Não é possível excluir serviço com agendamentos ativos. Desative o serviço em vez de excluí-lo.',
        400
      );
    }

    await prisma.service.delete({
      where: { id },
    });

    return sendSuccess(res, null, 'Serviço excluído com sucesso');
  });

  /**
   * Ativar/Desativar serviço
   */
  toggleServiceStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return sendNotFound(res, 'Serviço não encontrado');
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        isActive: !existingService.isActive,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const action = service.isActive ? 'ativado' : 'desativado';
    return sendSuccess(res, service, `Serviço ${action} com sucesso`);
  });

  /**
   * Obter categorias de serviços
   */
  getCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const categories = await prisma.service.findMany({
      where: {
        category: { not: null },
        isActive: true,
      },
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    });

    const categoryList = categories
      .map(item => item.category)
      .filter(category => category !== null);

    return sendSuccess(res, categoryList, 'Categorias obtidas com sucesso');
  });

  /**
   * Obter estatísticas dos serviços
   */
  getServicesStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate } = req.query;

    // Filtros de data para agendamentos
    const appointmentWhere: any = {};
    if (startDate) {
      appointmentWhere.date = { gte: new Date(startDate as string) };
    }
    if (endDate) {
      appointmentWhere.date = { 
        ...appointmentWhere.date,
        lte: new Date(endDate as string)
      };
    }

    // Estatísticas básicas
    const totalServices = await prisma.service.count();
    const activeServices = await prisma.service.count({
      where: { isActive: true },
    });

    // Serviços mais populares
    const popularServices = await prisma.service.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        _count: {
          select: {
            appointments: {
              where: appointmentWhere,
            },
          },
        },
      },
      orderBy: {
        appointments: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Receita por serviço
    const servicesRevenue = await prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        ...appointmentWhere,
        status: 'COMPLETED',
      },
      _count: {
        id: true,
      },
    });

    // Calcular receita total
    const revenueData = await Promise.all(
      servicesRevenue.map(async (item) => {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId },
          select: { name: true, price: true },
        });
        
        return {
          serviceId: item.serviceId,
          serviceName: service?.name || 'Serviço não encontrado',
          appointments: item._count.id,
          revenue: (service?.price || 0) * item._count.id,
        };
      })
    );

    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);

    return sendSuccess(res, {
      totalServices,
      activeServices,
      inactiveServices: totalServices - activeServices,
      popularServices,
      revenueData,
      totalRevenue,
    }, 'Estatísticas dos serviços obtidas com sucesso');
  });
}

export default new ServicesController();