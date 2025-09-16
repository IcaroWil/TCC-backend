import { Request } from 'express';
import { User } from '@prisma/client';

// Extensão do Request para incluir user autenticado
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// DTOs para API
export interface CreateAppointmentDTO {
  serviceId: string;
  date: string;
  startTime: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
}

export interface UpdateAppointmentDTO {
  date?: string;
  startTime?: string;
  status?: string;
  notes?: string;
}

export interface CreateServiceDTO {
  name: string;
  description?: string;
  duration: number;
  price?: number;
  color?: string;
  category?: string;
}

export interface UpdateServiceDTO {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  color?: string;
  category?: string;
  isActive?: boolean;
}

export interface CreateUserDTO {
  email: string;
  name: string;
  password?: string;
  role?: string;
  phone?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateBusinessHoursDTO {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface CreateHolidayDTO {
  date: string;
  name: string;
  description?: string;
  isRecurring?: boolean;
}

export interface TimeSlotDTO {
  date: string;
  startTime: string;
  endTime: string;
  isBlocked?: boolean;
  reason?: string;
}

export interface AvailabilityQuery {
  serviceId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface AppointmentQuery {
  startDate?: string;
  endDate?: string;
  status?: string;
  serviceId?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
  totalClients: number;
  totalServices: number;
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  appointmentsByStatus: {
    scheduled: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  popularServices: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationData {
  appointmentId: string;
  clientEmail: string;
  clientName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule';
}