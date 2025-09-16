import { Response } from 'express';
import { AuthenticatedRequest, AvailabilityQuery, TimeSlotDTO } from '@/types';
import { sendSuccess, sendError } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import availabilityService from '@/services/availabilityService';

class AvailabilityController {
  /**
   * Obter horários disponíveis para um serviço em uma data
   */
  getAvailableSlots = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serviceId, date } = req.query;

    if (!serviceId || !date) {
      return sendError(res, 'ID do serviço e data são obrigatórios');
    }

    try {
      const slots = await availabilityService.getAvailableSlots(
        serviceId as string,
        date as string
      );

      return sendSuccess(res, {
        date,
        serviceId,
        availableSlots: slots,
        totalSlots: slots.length,
      }, 'Horários disponíveis obtidos com sucesso');
    } catch (error) {
      console.error('Erro ao obter horários disponíveis:', error);
      return sendError(res, 'Erro ao obter horários disponíveis', 500);
    }
  });

  /**
   * Obter disponibilidade para um período
   */
  getAvailabilityRange = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query: AvailabilityQuery = req.validatedQuery || {};

    if (!query.serviceId || !query.startDate || !query.endDate) {
      return sendError(res, 'ID do serviço, data inicial e data final são obrigatórios');
    }

    try {
      const availability = await availabilityService.getAvailabilityRange(query);

      return sendSuccess(res, {
        serviceId: query.serviceId,
        startDate: query.startDate,
        endDate: query.endDate,
        availability,
      }, 'Disponibilidade do período obtida com sucesso');
    } catch (error) {
      console.error('Erro ao obter disponibilidade do período:', error);
      return sendError(res, 'Erro ao obter disponibilidade do período', 500);
    }
  });

  /**
   * Verificar se um horário específico está disponível
   */
  checkSlotAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serviceId, date, startTime } = req.query;

    if (!serviceId || !date || !startTime) {
      return sendError(res, 'ID do serviço, data e horário são obrigatórios');
    }

    try {
      const isAvailable = await availabilityService.isSlotAvailable(
        serviceId as string,
        date as string,
        startTime as string
      );

      return sendSuccess(res, {
        serviceId,
        date,
        startTime,
        isAvailable,
      }, 'Verificação de disponibilidade realizada com sucesso');
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return sendError(res, 'Erro ao verificar disponibilidade', 500);
    }
  });

  /**
   * Obter próximos horários disponíveis
   */
  getNextAvailableSlots = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serviceId, limit = '10' } = req.query;

    if (!serviceId) {
      return sendError(res, 'ID do serviço é obrigatório');
    }

    try {
      const slots = await availabilityService.getNextAvailableSlots(
        serviceId as string,
        parseInt(limit as string)
      );

      return sendSuccess(res, {
        serviceId,
        nextAvailableSlots: slots,
        totalFound: slots.length,
      }, 'Próximos horários disponíveis obtidos com sucesso');
    } catch (error) {
      console.error('Erro ao obter próximos horários:', error);
      return sendError(res, 'Erro ao obter próximos horários', 500);
    }
  });

  /**
   * Bloquear horários (apenas admin)
   */
  blockTimeSlots = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { date, startTime, endTime, reason }: TimeSlotDTO = req.validatedData;

    try {
      await availabilityService.blockTimeSlots(date, startTime, endTime, reason);

      return sendSuccess(res, {
        date,
        startTime,
        endTime,
        reason,
        blocked: true,
      }, 'Horários bloqueados com sucesso');
    } catch (error) {
      console.error('Erro ao bloquear horários:', error);
      return sendError(res, 'Erro ao bloquear horários', 500);
    }
  });

  /**
   * Desbloquear horários (apenas admin)
   */
  unblockTimeSlots = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { date, startTime } = req.body;

    if (!date || !startTime) {
      return sendError(res, 'Data e horário inicial são obrigatórios');
    }

    try {
      await availabilityService.unblockTimeSlots(date, startTime);

      return sendSuccess(res, {
        date,
        startTime,
        blocked: false,
      }, 'Horários desbloqueados com sucesso');
    } catch (error) {
      console.error('Erro ao desbloquear horários:', error);
      return sendError(res, 'Erro ao desbloquear horários', 500);
    }
  });

  /**
   * Obter estatísticas de disponibilidade (apenas admin)
   */
  getAvailabilityStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return sendError(res, 'Data inicial e final são obrigatórias');
    }

    try {
      const stats = await availabilityService.getAvailabilityStats(
        startDate as string,
        endDate as string
      );

      return sendSuccess(res, {
        period: {
          startDate,
          endDate,
        },
        ...stats,
      }, 'Estatísticas de disponibilidade obtidas com sucesso');
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return sendError(res, 'Erro ao obter estatísticas', 500);
    }
  });
}

export default new AvailabilityController();