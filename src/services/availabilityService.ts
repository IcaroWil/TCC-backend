import { PrismaClient } from '@prisma/client';
import { 
  generateTimeSlots, 
  createDateTime, 
  isTimeSlotAvailable, 
  getDayBounds,
  timeToMinutes,
  minutesToTime,
  isWithinBusinessHours 
} from '@/utils/date';
import { AvailabilityQuery } from '@/types';
import { addDays, format, parseISO, getDay } from 'date-fns';

const prisma = new PrismaClient();

class AvailabilityService {
  /**
   * Obter horários disponíveis para um serviço em uma data específica
   */
  async getAvailableSlots(
    serviceId: string,
    date: string
  ): Promise<string[]> {
    try {
      // Buscar informações do serviço
      const service = await prisma.service.findUnique({
        where: { id: serviceId, isActive: true },
      });

      if (!service) {
        throw new Error('Serviço não encontrado');
      }

      // Verificar se a data não é um feriado
      const isHoliday = await this.isHoliday(date);
      if (isHoliday) {
        return [];
      }

      // Obter horário de funcionamento para o dia da semana
      const dayOfWeek = getDay(parseISO(date));
      const businessHours = await prisma.businessHours.findUnique({
        where: { dayOfWeek, isActive: true },
      });

      if (!businessHours) {
        return [];
      }

      // Obter configurações do sistema
      const bufferMinutes = await this.getBufferMinutes();

      // Gerar slots de tempo baseados no horário de funcionamento
      const allSlots = generateTimeSlots(
        date,
        businessHours.startTime,
        businessHours.endTime,
        service.duration,
        bufferMinutes
      );

      // Filtrar slots já ocupados ou bloqueados
      const availableSlots = await this.filterAvailableSlots(
        allSlots,
        date,
        service.duration
      );

      return availableSlots;
    } catch (error) {
      console.error('Erro ao obter slots disponíveis:', error);
      throw error;
    }
  }

  /**
   * Obter disponibilidade para múltiplos dias
   */
  async getAvailabilityRange(
    query: AvailabilityQuery
  ): Promise<Record<string, string[]>> {
    try {
      const { serviceId, startDate, endDate } = query;

      if (!serviceId || !startDate || !endDate) {
        throw new Error('Parâmetros obrigatórios não fornecidos');
      }

      const availability: Record<string, string[]> = {};
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      let currentDate = start;
      while (currentDate <= end) {
        const dateString = format(currentDate, 'yyyy-MM-dd');
        availability[dateString] = await this.getAvailableSlots(serviceId, dateString);
        currentDate = addDays(currentDate, 1);
      }

      return availability;
    } catch (error) {
      console.error('Erro ao obter disponibilidade de intervalo:', error);
      throw error;
    }
  }

  /**
   * Verificar se um horário específico está disponível
   */
  async isSlotAvailable(
    serviceId: string,
    date: string,
    startTime: string
  ): Promise<boolean> {
    try {
      const service = await prisma.service.findUnique({
        where: { id: serviceId, isActive: true },
      });

      if (!service) {
        return false;
      }

      // Verificar se é feriado
      if (await this.isHoliday(date)) {
        return false;
      }

      // Verificar horário de funcionamento
      const dayOfWeek = getDay(parseISO(date));
      const businessHours = await prisma.businessHours.findUnique({
        where: { dayOfWeek, isActive: true },
      });

      if (!businessHours) {
        return false;
      }

      // Verificar se está dentro do horário de funcionamento
      if (!isWithinBusinessHours(startTime, businessHours.startTime, businessHours.endTime)) {
        return false;
      }

      // Criar DateTime do agendamento
      const appointmentStart = createDateTime(date, startTime);
      const appointmentEnd = new Date(appointmentStart.getTime() + service.duration * 60000);

      // Verificar conflitos com agendamentos existentes
      const conflicts = await prisma.appointment.findMany({
        where: {
          date: parseISO(date),
          status: {
            in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
          },
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

      if (conflicts.length > 0) {
        return false;
      }

      // Verificar slots bloqueados
      const blockedSlots = await prisma.timeSlot.findMany({
        where: {
          date: parseISO(date),
          isBlocked: true,
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              startTime: startTime
            }
          ]
        }
      });

      return blockedSlots.length === 0;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade do slot:', error);
      return false;
    }
  }

  /**
   * Bloquear horários específicos
   */
  async blockTimeSlots(
    date: string,
    startTime: string,
    endTime: string,
    reason?: string
  ): Promise<void> {
    try {
      await prisma.timeSlot.create({
        data: {
          date: parseISO(date),
          startTime,
          endTime,
          isBlocked: true,
          reason,
        },
      });
    } catch (error) {
      console.error('Erro ao bloquear horários:', error);
      throw error;
    }
  }

  /**
   * Desbloquear horários específicos
   */
  async unblockTimeSlots(date: string, startTime: string): Promise<void> {
    try {
      await prisma.timeSlot.deleteMany({
        where: {
          date: parseISO(date),
          startTime,
          isBlocked: true,
        },
      });
    } catch (error) {
      console.error('Erro ao desbloquear horários:', error);
      throw error;
    }
  }

  /**
   * Obter próximos horários disponíveis
   */
  async getNextAvailableSlots(
    serviceId: string,
    limit: number = 10
  ): Promise<Array<{ date: string; time: string; datetime: string }>> {
    try {
      const nextSlots: Array<{ date: string; time: string; datetime: string }> = [];
      let currentDate = new Date();
      let daysChecked = 0;
      const maxDays = 30; // Limitar busca a 30 dias

      while (nextSlots.length < limit && daysChecked < maxDays) {
        const dateString = format(currentDate, 'yyyy-MM-dd');
        const availableSlots = await this.getAvailableSlots(serviceId, dateString);

        for (const slot of availableSlots) {
          if (nextSlots.length >= limit) break;
          
          nextSlots.push({
            date: dateString,
            time: slot,
            datetime: `${dateString} ${slot}`,
          });
        }

        currentDate = addDays(currentDate, 1);
        daysChecked++;
      }

      return nextSlots;
    } catch (error) {
      console.error('Erro ao obter próximos horários disponíveis:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de disponibilidade
   */
  async getAvailabilityStats(startDate: string, endDate: string) {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      // Contar total de slots possíveis
      let totalSlots = 0;
      let availableSlots = 0;
      let bookedSlots = 0;
      
      const services = await prisma.service.findMany({
        where: { isActive: true },
      });

      for (const service of services) {
        let currentDate = start;
        while (currentDate <= end) {
          const dateString = format(currentDate, 'yyyy-MM-dd');
          const dayOfWeek = getDay(currentDate);
          
          const businessHours = await prisma.businessHours.findUnique({
            where: { dayOfWeek, isActive: true },
          });

          if (businessHours && !await this.isHoliday(dateString)) {
            const slots = generateTimeSlots(
              dateString,
              businessHours.startTime,
              businessHours.endTime,
              service.duration
            );
            
            totalSlots += slots.length;
            
            const available = await this.getAvailableSlots(service.id, dateString);
            availableSlots += available.length;
            bookedSlots += slots.length - available.length;
          }

          currentDate = addDays(currentDate, 1);
        }
      }

      return {
        totalSlots,
        availableSlots,
        bookedSlots,
        occupancyRate: totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de disponibilidade:', error);
      throw error;
    }
  }

  /**
   * Filtrar slots disponíveis removendo os ocupados
   */
  private async filterAvailableSlots(
    slots: string[],
    date: string,
    duration: number
  ): Promise<string[]> {
    const availableSlots: string[] = [];
    const { start, end } = getDayBounds(date);

    // Buscar agendamentos existentes do dia
    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: start, lte: end },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Buscar slots bloqueados
    const blockedSlots = await prisma.timeSlot.findMany({
      where: {
        date: { gte: start, lte: end },
        isBlocked: true,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    for (const slot of slots) {
      const slotStart = createDateTime(date, slot);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      // Verificar conflitos com agendamentos
      const hasAppointmentConflict = appointments.some(appointment =>
        !isTimeSlotAvailable(slotStart, slotEnd, [{
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        }])
      );

      // Verificar conflitos com slots bloqueados
      const hasBlockedConflict = blockedSlots.some(blocked => {
        const blockedStart = createDateTime(date, blocked.startTime);
        const blockedEnd = createDateTime(date, blocked.endTime);
        
        return !isTimeSlotAvailable(slotStart, slotEnd, [{
          startTime: blockedStart,
          endTime: blockedEnd,
        }]);
      });

      if (!hasAppointmentConflict && !hasBlockedConflict) {
        availableSlots.push(slot);
      }
    }

    return availableSlots;
  }

  /**
   * Verificar se uma data é feriado
   */
  private async isHoliday(date: string): Promise<boolean> {
    const holiday = await prisma.holiday.findUnique({
      where: { date: parseISO(date) },
    });

    return !!holiday;
  }

  /**
   * Obter tempo de buffer em minutos
   */
  private async getBufferMinutes(): Promise<number> {
    const setting = await prisma.settings.findUnique({
      where: { key: 'appointment_buffer_minutes' },
    });

    return setting ? parseInt(setting.value) : 15;
  }
}

export default new AvailabilityService();