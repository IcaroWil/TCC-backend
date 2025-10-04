import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UsersService } from '../users/users.service';
import { ServicesService } from '../services/services.service';
import { SchedulesService } from '../schedules/schedules.service';
import { NotificationService } from '../common/notifications/notification.service';
// import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private servicesService: ServicesService,
    private schedulesService: SchedulesService,
    private notificationService: NotificationService,
  ) {}

  async create(userId: number, createAppointmentDto: CreateAppointmentDto) {
    const schedule = await this.schedulesService.findOne(createAppointmentDto.scheduleId);
    if (!schedule) throw new NotFoundException('Horário não encontrado');

    const service = await (this.prisma as any).service.findUnique({ where: { id: createAppointmentDto.serviceId } });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    const existingAppointment = await (this.prisma as any).appointment.findFirst({ where: { scheduleId: createAppointmentDto.scheduleId } });
    if (existingAppointment) throw new ConflictException('Este horário já está reservado');

    const appointment = await (this.prisma as any).appointment.create({
      data: {
        userId,
        scheduleId: createAppointmentDto.scheduleId,
        serviceId: createAppointmentDto.serviceId,
      },
      include: { schedule: true, user: true, service: true },
    });

    const customerEmail = appointment.user.email;
    const notifyAdmin = (process.env.ADMIN_NOTIFICATIONS_ENABLED ?? 'true') !== 'false';
    const serviceName = appointment.service.name;
    const serviceDescription = appointment.service.description;
    const servicePrice = appointment.service.price;
    const customerName = appointment.user.name;
    const dateIso = (appointment.schedule as any).date as string;
    const dateStr = dateIso ? new Date(dateIso).toLocaleDateString('pt-BR') : '';
    const timeSlot = `${appointment.schedule.startTime} - ${appointment.schedule.endTime}`;
    

    // Parse the date correctly without timezone issues
    const dateOnly = new Date(dateIso);
    const [startHour, startMinute] = appointment.schedule.startTime.split(':');
    const [endHour, endMinute] = appointment.schedule.endTime.split(':');
    
    // Create dates in local timezone to avoid timezone conversion issues
    const startDateTime = new Date(
      dateOnly.getFullYear(),
      dateOnly.getMonth(),
      dateOnly.getDate(),
      parseInt(startHour),
      parseInt(startMinute),
      0,
      0
    );
    
    const endDateTime = new Date(
      dateOnly.getFullYear(),
      dateOnly.getMonth(),
      dateOnly.getDate(),
      parseInt(endHour),
      parseInt(endMinute),
      0,
      0
    );
    
    const formatDateForCalendar = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const startDateFormatted = formatDateForCalendar(startDateTime);
    const endDateFormatted = formatDateForCalendar(endDateTime);
    
    const eventTitle = `${serviceName} - Agendamento`;
    const eventDescription = `${serviceDescription || ''}\n\nValor: R$ ${servicePrice.toFixed(2)}\n\nSistema de Agendamento Online`;
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDateFormatted}/${endDateFormatted}&details=${encodeURIComponent(eventDescription)}`;
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&startdt=${startDateTime.toISOString()}&enddt=${endDateTime.toISOString()}&body=${encodeURIComponent(eventDescription)}`;
    const appleUrl = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${startDateFormatted}%0ADTEND:${endDateFormatted}%0ASUMMARY:${encodeURIComponent(eventTitle)}%0ADESCRIPTION:${encodeURIComponent(eventDescription)}%0AEND:VEVENT%0AEND:VCALENDAR`;
    
    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">✅ Agendamento Confirmado</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #2c3e50; margin-bottom: 20px;">Olá <strong>${customerName}</strong>!</p>
          
          <p style="font-size: 16px; color: #555; margin-bottom: 25px;">Seu agendamento foi confirmado com sucesso:</p>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">📅 Detalhes do Agendamento</h3>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Serviço:</strong> ${serviceName}</p>
            ${serviceDescription ? `<p style="margin: 8px 0; font-size: 14px; color: #7f8c8d; font-style: italic;">${serviceDescription}</p>` : ''}
            <p style="margin: 8px 0; font-size: 16px;"><strong>Data:</strong> ${dateStr}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Horário:</strong> ${timeSlot}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Valor:</strong> R$ ${servicePrice.toFixed(2)}</p>
          </div>
          
          <div style="background-color: #3498db; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center;">
            <h3 style="color: white; margin-top: 0; margin-bottom: 15px;">📅 Adicionar ao Calendário</h3>
            <p style="color: white; margin-bottom: 15px; font-size: 14px;">Clique no botão abaixo para adicionar este agendamento ao seu calendário:</p>
            <a href="${googleCalendarUrl}" style="background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">📅 Google Calendar</a>
            <a href="${outlookUrl}" style="background-color: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">📅 Outlook</a>
            <a href="${appleUrl}" style="background-color: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">📅 Apple Calendar</a>
            <p style="color: #ecf0f1; margin-top: 15px; font-size: 12px; font-style: italic;">
              💡 Dica: Na próxima vez, você pode marcar "Adicionar ao calendário" durante o agendamento para receber o link direto!
            </p>
          </div>
          
          <p style="font-size: 14px; color: #7f8c8d; margin-top: 25px;">
            Caso precise reagendar ou cancelar, entre em contato conosco com antecedência.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #95a5a6; font-size: 12px;">Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </div>
    `;

    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🔔 Novo Agendamento</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #2c3e50; margin-bottom: 20px;">Você recebeu um novo agendamento:</p>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">👤 Cliente</h3>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Nome:</strong> ${customerName}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Email:</strong> ${appointment.user.email}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Telefone:</strong> ${appointment.user.phone || 'Não informado'}</p>
          </div>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">📅 Detalhes do Agendamento</h3>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Serviço:</strong> ${serviceName}</p>
            ${serviceDescription ? `<p style="margin: 8px 0; font-size: 14px; color: #7f8c8d; font-style: italic;">${serviceDescription}</p>` : ''}
            <p style="margin: 8px 0; font-size: 16px;"><strong>Data:</strong> ${dateStr}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Horário:</strong> ${timeSlot}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Valor:</strong> R$ ${servicePrice.toFixed(2)}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #95a5a6; font-size: 12px;">Sistema de Agendamento Online</p>
          </div>
        </div>
      </div>
    `;

    if (customerEmail) {
      await this.notificationService.sendEmail(customerEmail, '✅ Agendamento Confirmado', customerEmailHtml);
    }
    if (notifyAdmin) {
      const admins = await (this.prisma as any).user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });
      for (const a of admins) {
        if (a.email) {
          await this.notificationService.sendEmail(a.email, '🔔 Novo Agendamento Recebido', adminEmailHtml);
        }
      }
    }
    // WhatsApp desabilitado (somente e-mail ativo)

    return appointment;
  }

  async findOne(id: number) {
    const appt = await (this.prisma as any).appointment.findUnique({ where: { id }, include: { schedule: true, user: true, service: true } });
    if (!appt) throw new NotFoundException('Agendamento não encontrado');
    return appt;
  }

  async findMany(user: { userId: number; role: 'ADMIN' | 'CUSTOMER' }, take = 50, skip = 0) {
    const where = user.role === 'ADMIN' ? {} : { userId: user.userId };
    return (this.prisma as any).appointment.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: { schedule: true, user: true, service: true },
    });
  }

  async updateStatus(id: number, status: string) {
    const appointment = await (this.prisma as any).appointment.findUnique({ 
      where: { id }, 
      include: { schedule: true, user: true, service: true } 
    });
    
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.status === status) {
      return { ...appointment, message: `Agendamento já está ${status.toLowerCase() === 'cancelled' ? 'cancelado' : status.toLowerCase()}` };
    }

    const updatedAppointment = await (this.prisma as any).appointment.update({
      where: { id },
      data: { status },
      include: { schedule: true, user: true, service: true },
    });

    // Send cancellation email if status is CANCELLED
    if (status === 'CANCELLED') {
      this.sendCancellationEmail(updatedAppointment).catch(error => {
        console.error('Falha ao enviar email de cancelamento:', error);
      });
    }

    return {
      ...updatedAppointment,
      message: `Agendamento ${status.toLowerCase() === 'cancelled' ? 'cancelado' : status.toLowerCase()} com sucesso`
    };
  }

  async findAdminAppointments(adminId: number, take = 50, skip = 0) {
    return (this.prisma as any).appointment.findMany({
      where: {
        user: {
          role: 'ADMIN'
        }
      },
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: { schedule: true, user: true, service: true },
    });
  }

  private async sendCancellationEmail(appointment: any) {
    const { user, service, schedule } = appointment;
    
    // Parse date correctly without timezone issues
    const dateOnly = new Date(schedule.date);
    const formattedDate = `${String(dateOnly.getDate()).padStart(2,'0')}/${String(dateOnly.getMonth()+1).padStart(2,'0')}/${dateOnly.getFullYear()}`;
    const formattedTime = `${schedule.startTime} - ${schedule.endTime}`;
    
    const emailSubject = `❌ Agendamento Cancelado - ${service.name}`;
    
    const cancellationEmailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 0 auto; background:#f4f6f8; padding:24px;">
        <div style="background:#dc3545; color:#fff; border-radius:12px 12px 0 0; padding:20px 24px; font-weight:bold; font-size:20px;">
          ❌ Agendamento Cancelado
        </div>
        <div style="background:#fff; border-radius:0 0 12px 12px; box-shadow:0 2px 12px rgba(0,0,0,.06); padding:0 24px 24px;">
          <div style="padding-top:16px; font-size:16px; color:#1f2937;">Olá <strong>${user.name}</strong>!</div>
          <div style="color:#4b5563; margin-bottom:18px;">Infelizmente, seu agendamento foi cancelado:</div>

          <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:16px 18px; margin-bottom:22px;">
            <div style="color:#dc2626; font-weight:700; margin-bottom:10px;">📅 Detalhes do Agendamento Cancelado</div>
            <div style="margin:6px 0; color:#111827;"><strong>Serviço:</strong> ${service.name}</div>
            <div style="margin:2px 0; color:#6b7280; font-style:italic;">${service.description || ''}</div>
            <div style="margin:6px 0;"><strong style="color:#dc2626;">Data:</strong> <span style="color:#dc2626; font-weight:700;">${formattedDate}</span></div>
            <div style="margin:6px 0;"><strong style="color:#dc2626;">Horário:</strong> <span style="color:#dc2626; font-weight:700;">${formattedTime}</span></div>
            <div style="margin:6px 0;"><strong>Valor:</strong> R$ ${service.price.toFixed(2)}</div>
          </div>

          <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:18px; margin-bottom:22px;">
            <div style="color:#0369a1; font-weight:700; margin-bottom:12px;">ℹ️ Informações Importantes</div>
            <div style="color:#0c4a6e; font-size:14px; line-height:1.5;">
              • Entre em contato conosco para reagendar seu serviço<br/>
              • Não há cobrança pelo agendamento cancelado<br/>
              • Estamos disponíveis para esclarecer qualquer dúvida
            </div>
          </div>

          <div style="text-align:center; color:#6b7280; font-size:14px; padding-top:8px;">
            Pedimos desculpas pelo inconveniente.<br/>
            Entre em contato conosco para reagendar.
          </div>
        </div>
      </div>
    `;
    
    const whatsappMessage = `❌ *Agendamento Cancelado*\n\n` +
      `Olá ${user.name}!\n\n` +
      `Infelizmente, seu agendamento foi cancelado:\n\n` +
      `📋 *Serviço:* ${service.name}\n` +
      `📝 *Descrição:* ${service.description || 'N/A'}\n` +
      `💰 *Preço:* R$ ${service.price.toFixed(2)}\n` +
      `📅 *Data:* ${formattedDate}\n` +
      `⏰ *Horário:* ${formattedTime}\n\n` +
      `Entre em contato conosco para reagendar seu serviço.\n` +
      `Pedimos desculpas pelo inconveniente.`;
    
    // Send email notification
    await this.notificationService.sendEmail(user.email, emailSubject, cancellationEmailHtml);
    
    // Send WhatsApp notification if phone is available
    if (user.phone) {
      await this.notificationService.sendWhatsApp(user.phone, whatsappMessage);
    }
  }
}