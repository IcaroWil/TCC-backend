import { format, addMinutes, isAfter, isBefore, isEqual, startOfDay, endOfDay, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formatar data para string no formato brasileiro
 */
export function formatDateToBR(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
}

/**
 * Formatar horário para string
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm');
}

/**
 * Formatar data e horário completo
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

/**
 * Criar DateTime a partir de data e horário
 */
export function createDateTime(date: string, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const dateObj = parseISO(date);
  dateObj.setHours(hours, minutes, 0, 0);
  return dateObj;
}

/**
 * Adicionar minutos a uma data/hora
 */
export function addMinutesToDateTime(dateTime: Date, minutes: number): Date {
  return addMinutes(dateTime, minutes);
}

/**
 * Verificar se um horário está disponível
 */
export function isTimeSlotAvailable(
  startTime: Date,
  endTime: Date,
  existingAppointments: Array<{ startTime: Date; endTime: Date }>
): boolean {
  return !existingAppointments.some(appointment => 
    // Verifica sobreposição de horários
    (isAfter(startTime, appointment.startTime) && isBefore(startTime, appointment.endTime)) ||
    (isAfter(endTime, appointment.startTime) && isBefore(endTime, appointment.endTime)) ||
    (isBefore(startTime, appointment.startTime) && isAfter(endTime, appointment.endTime)) ||
    isEqual(startTime, appointment.startTime)
  );
}

/**
 * Gerar slots de tempo disponíveis para um dia
 */
export function generateTimeSlots(
  date: string,
  startHour: string,
  endHour: string,
  slotDuration: number,
  bufferMinutes: number = 0
): string[] {
  const slots: string[] = [];
  const [startH, startM] = startHour.split(':').map(Number);
  const [endH, endM] = endHour.split(':').map(Number);
  
  let currentTime = new Date();
  currentTime.setHours(startH, startM, 0, 0);
  
  const endTime = new Date();
  endTime.setHours(endH, endM, 0, 0);
  
  while (isBefore(currentTime, endTime)) {
    const nextSlot = addMinutes(currentTime, slotDuration + bufferMinutes);
    
    if (isBefore(nextSlot, endTime) || isEqual(nextSlot, endTime)) {
      slots.push(format(currentTime, 'HH:mm'));
    }
    
    currentTime = nextSlot;
  }
  
  return slots;
}

/**
 * Verificar se uma data é válida
 */
export function isValidDate(dateString: string): boolean {
  const date = parseISO(dateString);
  return isValid(date);
}

/**
 * Verificar se uma data é hoje
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return format(dateObj, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
}

/**
 * Obter início e fim do dia
 */
export function getDayBounds(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return {
    start: startOfDay(dateObj),
    end: endOfDay(dateObj)
  };
}

/**
 * Converter string de horário para minutos desde meia-noite
 */
export function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converter minutos desde meia-noite para string de horário
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Verificar se um horário está dentro do horário de funcionamento
 */
export function isWithinBusinessHours(
  time: string,
  businessStart: string,
  businessEnd: string
): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(businessStart);
  const endMinutes = timeToMinutes(businessEnd);
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

/**
 * Obter nome do dia da semana em português
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[dayOfWeek];
}

/**
 * Obter nome do mês em português
 */
export function getMonthName(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMMM', { locale: ptBR });
}