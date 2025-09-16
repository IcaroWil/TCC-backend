import { z } from 'zod';

// Esquemas de validação para DTOs
export const createAppointmentSchema = z.object({
  serviceId: z.string().min(1, 'ID do serviço é obrigatório'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM'),
  clientName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  clientEmail: z.string().email('Email inválido').optional(),
  clientPhone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres').optional(),
  notes: z.string().max(500, 'Observações não podem exceder 500 caracteres').optional(),
});

export const updateAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM').optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().max(500, 'Observações não podem exceder 500 caracteres').optional(),
});

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().max(1000, 'Descrição não pode exceder 1000 caracteres').optional(),
  duration: z.number().min(5, 'Duração mínima é 5 minutos').max(480, 'Duração máxima é 8 horas'),
  price: z.number().min(0, 'Preço deve ser positivo').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal').optional(),
  category: z.string().max(100, 'Categoria não pode exceder 100 caracteres').optional(),
});

export const updateServiceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  description: z.string().max(1000, 'Descrição não pode exceder 1000 caracteres').optional(),
  duration: z.number().min(5, 'Duração mínima é 5 minutos').max(480, 'Duração máxima é 8 horas').optional(),
  price: z.number().min(0, 'Preço deve ser positivo').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal').optional(),
  category: z.string().max(100, 'Categoria não pode exceder 100 caracteres').optional(),
  isActive: z.boolean().optional(),
});

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(['CLIENT', 'ADMIN', 'SUPER_ADMIN']).optional(),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const updateBusinessHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM'),
  isActive: z.boolean(),
});

export const createHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().max(500, 'Descrição não pode exceder 500 caracteres').optional(),
  isRecurring: z.boolean().optional(),
});

export const timeSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM'),
  isBlocked: z.boolean().optional(),
  reason: z.string().max(200, 'Motivo não pode exceder 200 caracteres').optional(),
});

export const availabilityQuerySchema = z.object({
  serviceId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
});

export const appointmentQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  serviceId: z.string().optional(),
  clientId: z.string().optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => parseInt(val) || 10).optional(),
});