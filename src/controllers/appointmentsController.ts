import { Response } from 'express';
import { PrismaClient, AppointmentStatus } from '@prisma/client';
import { AuthenticatedRequest, CreateAppointmentDTO, UpdateAppointmentDTO, AppointmentQuery } from '@/types';
import { sendSuccess, sendError, sendNotFound, calculatePagination, sendSuccessWithPagination } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import { createDateTime, formatDateTime, getDayBounds } from '@/utils/date';
import availabilityService from '@/services/availabilityService';
import emailService from '@/services/emailService';
import { parseISO } from 'date-fns';

const prisma = new PrismaClient();

class AppointmentsController {
  /**
   * Listar agendamentos
   */
  getAppointments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query: AppointmentQuery = req.validatedQuery || {};
    const { page = 1, limit = 10 } = query;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const { offset } = calculatePagination(pageNum, limitNum, 0);

    // Filtros
    const where: any = {};

    // Se não for admin, mostrar apenas próprios agendamentos
    if (!isAdmin && req.user) {
      where.clientId = req.user.id;
    }

    if (query.startDate) {
      where.date = { gte: parseISO(query.startDate) };
    }

    if (query.endDate) {
      where.date = { 
        ...where.date,
        lte: parseISO(query.endDate)
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.serviceId) {
      where.serviceId = query.serviceId;
    }

    if (query.clientId && isAdmin) {
      where.clientId = query.clientId;
    }

    // Contar total de registros
    const total = await prisma.appointment.count({ where });

    // Buscar agendamentos
    const appointments = await prisma.appointment.findMany({
      where,
      skip: offset,
      take: limitNum,
      orderBy: [
        { date: 'desc' },
        { startTime: 'desc' },
      ],
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            color: true,
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const pagination = calculatePagination(pageNum, limitNum, total);

    return sendSuccessWithPagination(
      res,
      appointments,
      pagination,
      'Agendamentos obtidos com sucesso'
    );
  });

  /**
   * Obter um agendamento específico
   */
  getAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    const where: any = { id };
    
    // Se não for admin, verificar se é o próprio agendamento
    if (!isAdmin && req.user) {
      where.clientId = req.user.id;
    }

    const appointment = await prisma.appointment.findUnique({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            color: true,
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    if (!appointment) {
      return sendNotFound(res, 'Agendamento não encontrado');
    }

    return sendSuccess(res, appointment, 'Agendamento obtido com sucesso');
  });

  /**
   * Criar novo agendamento
   */
  createAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serviceId, date, startTime, clientName, clientEmail, clientPhone, notes }: CreateAppointmentDTO = req.validatedData;

    // Verificar se o serviço existe e está ativo
    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
    });

    if (!service) {
      return sendError(res, 'Serviço não encontrado ou inativo');
    }

    // Verificar se o horário está disponível
    const isAvailable = await availabilityService.isSlotAvailable(serviceId, date, startTime);
    if (!isAvailable) {
      return sendError(res, 'Horário não está disponível');
    }

    // Criar DateTime do agendamento
    const appointmentStart = createDateTime(date, startTime);
    const appointmentEnd = new Date(appointmentStart.getTime() + service.duration * 60000);

    // Determinar dados do cliente
    let clientId: string | null = null;
    let finalClientName = clientName;
    let finalClientEmail = clientEmail;
    let finalClientPhone = clientPhone;

    if (req.user) {
      // Usuário autenticado
      clientId = req.user.id;
      finalClientName = req.user.name;
      finalClientEmail = req.user.email;
      finalClientPhone = req.user.phone || clientPhone;
    } else {
      // Cliente não autenticado - dados obrigatórios
      if (!clientName || !clientEmail) {
        return sendError(res, 'Nome e email são obrigatórios para agendamentos');
      }
    }

    // Criar agendamento
    const appointment = await prisma.appointment.create({
      data: {
        serviceId,
        date: parseISO(date),
        startTime: appointmentStart,
        endTime: appointmentEnd,
        clientId,
        clientName: finalClientName,
        clientEmail: finalClientEmail,
        clientPhone: finalClientPhone,
        notes,
        status: AppointmentStatus.SCHEDULED,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            color: true,
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Enviar email de confirmação
    if (finalClientEmail) {
      try {
        await emailService.sendAppointmentConfirmation({
          appointmentId: appointment.id,
          clientEmail: finalClientEmail,
          clientName: finalClientName || 'Cliente',
          serviceName: service.name,
          appointmentDate: date,
          appointmentTime: startTime,
          type: 'confirmation',
        });
      } catch (error) {
        console.error('Erro ao enviar email de confirmação:', error);
        // Não falha a criação do agendamento se o email falhar
      }
    }

    return sendSuccess(res, appointment, 'Agendamento criado com sucesso', 201);
  });

  /**
   * Atualizar agendamento
   */
  updateAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateAppointmentDTO = req.validatedData;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    // Verificar se o agendamento existe
    const where: any = { id };
    if (!isAdmin && req.user) {
      where.clientId = req.user.id;
    }

    const existingAppointment = await prisma.appointment.findUnique({
      where,
      include: {
        service: true,
        client: true,
      },
    });

    if (!existingAppointment) {
      return sendNotFound(res, 'Agendamento não encontrado');
    }

    // Preparar dados de atualização
    const updateFields: any = {};

    // Se mudou data ou horário, verificar disponibilidade
    if (updateData.date || updateData.startTime) {
      const newDate = updateData.date || existingAppointment.date.toISOString().split('T')[0];
      const newStartTime = updateData.startTime || existingAppointment.startTime.toTimeString().slice(0, 5);

      // Verificar se o novo horário está disponível (excluindo o próprio agendamento)
      const isAvailable = await this.isSlotAvailableForUpdate(
        existingAppointment.serviceId,
        newDate,
        newStartTime,
        id
      );

      if (!isAvailable) {
        return sendError(res, 'Novo horário não está disponível');
      }

      if (updateData.date) {
        updateFields.date = parseISO(updateData.date);
      }

      if (updateData.startTime) {
        const newStartDateTime = createDateTime(newDate, newStartTime);
        const newEndDateTime = new Date(newStartDateTime.getTime() + existingAppointment.service.duration * 60000);
        
        updateFields.startTime = newStartDateTime;
        updateFields.endTime = newEndDateTime;
      }
    }

    if (updateData.status) {
      updateFields.status = updateData.status;
    }

    if (updateData.notes !== undefined) {
      updateFields.notes = updateData.notes;
    }

    // Atualizar agendamento
    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateFields,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            color: true,
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Enviar notificação por email se houve mudança de data/horário
    if ((updateData.date || updateData.startTime) && existingAppointment.clientEmail) {
      try {
        await emailService.sendAppointmentReschedule({
          appointmentId: appointment.id,
          clientEmail: existingAppointment.clientEmail,
          clientName: existingAppointment.clientName || 'Cliente',
          serviceName: existingAppointment.service.name,
          appointmentDate: appointment.date.toISOString().split('T')[0],
          appointmentTime: appointment.startTime.toTimeString().slice(0, 5),
          type: 'reschedule',
        });
      } catch (error) {
        console.error('Erro ao enviar email de reagendamento:', error);
      }
    }

    return sendSuccess(res, appointment, 'Agendamento atualizado com sucesso');
  });

  /**
   * Cancelar agendamento
   */
  cancelAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    // Verificar se o agendamento existe
    const where: any = { id };
    if (!isAdmin && req.user) {
      where.clientId = req.user.id;
    }

    const appointment = await prisma.appointment.findUnique({
      where,
      include: {
        service: true,
        client: true,
      },
    });

    if (!appointment) {
      return sendNotFound(res, 'Agendamento não encontrado');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return sendError(res, 'Agendamento já está cancelado');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      return sendError(res, 'Não é possível cancelar um agendamento já concluído');
    }

    // Cancelar agendamento
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            color: true,
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Enviar email de cancelamento
    if (appointment.clientEmail) {
      try {
        await emailService.sendAppointmentCancellation({
          appointmentId: appointment.id,
          clientEmail: appointment.clientEmail,
          clientName: appointment.clientName || 'Cliente',
          serviceName: appointment.service.name,
          appointmentDate: appointment.date.toISOString().split('T')[0],
          appointmentTime: appointment.startTime.toTimeString().slice(0, 5),
          type: 'cancellation',
        });
      } catch (error) {
        console.error('Erro ao enviar email de cancelamento:', error);
      }
    }

    return sendSuccess(res, updatedAppointment, 'Agendamento cancelado com sucesso');
  });

  /**
   * Confirmar agendamento (apenas admin)
   */
  confirmAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        client: true,
      },
    });

    if (!appointment) {
      return sendNotFound(res, 'Agendamento não encontrado');
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      return sendError(res, 'Apenas agendamentos com status "agendado" podem ser confirmados');
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CONFIRMED },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            color: true,
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return sendSuccess(res, updatedAppointment, 'Agendamento confirmado com sucesso');
  });

  /**
   * Marcar como concluído (apenas admin)
   */
  completeAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return sendNotFound(res, 'Agendamento não encontrado');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      return sendError(res, 'Agendamento já está concluído');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return sendError(res, 'Não é possível concluir um agendamento cancelado');
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.COMPLETED },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            color: true,
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return sendSuccess(res, updatedAppointment, 'Agendamento marcado como concluído');
  });

  /**
   * Obter agendamentos do dia atual
   */
  getTodayAppointments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const today = new Date();
    const { start, end } = getDayBounds(today.toISOString().split('T')[0]);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: start, lte: end },
        status: { not: AppointmentStatus.CANCELLED },
      },
      orderBy: { startTime: 'asc' },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            color: true,
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return sendSuccess(res, appointments, 'Agendamentos de hoje obtidos com sucesso');
  });

  /**
   * Verificar se um slot está disponível para atualização (excluindo o próprio agendamento)
   */
  private async isSlotAvailableForUpdate(
    serviceId: string,
    date: string,
    startTime: string,
    excludeAppointmentId: string
  ): Promise<boolean> {
    try {
      const service = await prisma.service.findUnique({
        where: { id: serviceId, isActive: true },
      });

      if (!service) {
        return false;
      }

      const appointmentStart = createDateTime(date, startTime);
      const appointmentEnd = new Date(appointmentStart.getTime() + service.duration * 60000);
      const { start, end } = getDayBounds(date);

      // Verificar conflitos com outros agendamentos (excluindo o atual)
      const conflicts = await prisma.appointment.findMany({
        where: {
          id: { not: excludeAppointmentId },
          date: { gte: start, lte: end },
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
          OR: [
            {
              AND: [
                { startTime: { lte: appointmentStart } },
                { endTime: { gt: appointmentStart } }
              ]
            },
            {
              AND: [
                { startTime: { lt: appointmentEnd } },
                { endTime: { gte: appointmentEnd } }
              ]
            },
            {
              AND: [
                { startTime: { gte: appointmentStart } },
                { endTime: { lte: appointmentEnd } }
              ]
            }
          ]
        }
      });

      return conflicts.length === 0;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade para atualização:', error);
      return false;
    }
  }
}

export default new AppointmentsController();