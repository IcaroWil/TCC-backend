import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationService } from '../common/notifications/notification.service';
import { CreateGuestAppointmentDto } from './dto/create-guest-appointment.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async getServices() {
    return this.prisma.service.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
      },
      orderBy: { name: 'asc' }
    });
  }

  async getServiceSchedules(serviceId: number, date?: string, available?: boolean) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const where: any = { serviceId };
    
    if (date) {
      const day = this.parseDateOnly(date);
      if (!day) {
        throw new BadRequestException('Invalid date. Use YYYY-MM-DD format.');
      }
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      where.date = { gte: day, lt: next };
    }
    
    if (available === true) {
      where.isAvailable = true;
      where.appointments = { none: {} };
    }

    return this.prisma.schedule.findMany({
      where,
      include: { 
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
          }
        },
        appointments: true 
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createGuestAppointment(createGuestAppointmentDto: CreateGuestAppointmentDto) {
    const { serviceId, scheduleId, name, email, phone, addToCalendar = false } = createGuestAppointmentDto;

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { appointments: true }
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    if (schedule.serviceId !== serviceId) {
      throw new BadRequestException('Schedule does not belong to the specified service');
    }

    if (!schedule.isAvailable || schedule.appointments.length > 0) {
      throw new ConflictException('This time slot is no longer available');
    }

    let user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: 'CUSTOMER'
        }
      });
    } else {
      const updateData: any = {};
      if (name && user.name !== name) updateData.name = name;
      if (phone && user.phone !== phone) updateData.phone = phone;
      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({ where: { id: user.id }, data: updateData });
      }
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        userId: user.id,
        serviceId,
        scheduleId,
        status: 'PENDING'
      },
      include: {
        user: true,
        service: true,
        schedule: true
      }
    });

    try {
      await this.sendAppointmentNotifications(appointment, addToCalendar);
    } catch (error) {
      console.error('Notification failed:', error);
    }

    const response: any = {
      id: appointment.id,
      userId: appointment.userId,
      serviceId: appointment.serviceId,
      scheduleId: appointment.scheduleId,
      status: appointment.status,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      user: appointment.user,
      service: appointment.service,
      schedule: appointment.schedule,
      message: 'Appointment created successfully. Check your email for confirmation.'
    };

    if (addToCalendar) {
      response.calendarUrl = this.generateCalendarUrl(appointment);
      response.calendarDirect = true;
    }

    return response;
  }

  private parseDateOnly(input: string): Date | null {
    if (!input) return null;

    const iso = new Date(input);
    if (!Number.isNaN(iso.getTime())) {
      return new Date(iso.getFullYear(), iso.getMonth(), iso.getDate());
    }

    const ymd = /^\d{4}-\d{2}-\d{2}$/;
    if (ymd.test(input)) {
      const [y, m, d] = input.split('-').map((v) => Number(v));
      return new Date(y, m - 1, d);
    }

    return null;
  }

  private async sendAppointmentNotifications(appointment: any, addToCalendar: boolean) {
    const { user, service, schedule } = appointment;
    
    const dateOnly = new Date(schedule.date);
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    
    const startDateTime = new Date(Date.UTC(
      dateOnly.getUTCFullYear(),
      dateOnly.getUTCMonth(),
      dateOnly.getUTCDate(),
      startHour,
      startMinute,
      0,
      0,
    ));
    const endDateTime = new Date(Date.UTC(
      dateOnly.getUTCFullYear(),
      dateOnly.getUTCMonth(),
      dateOnly.getUTCDate(),
      endHour,
      endMinute,
      0,
      0,
    ));
    
    const formattedDate = `${String(dateOnly.getUTCDate()).padStart(2,'0')}/${String(dateOnly.getUTCMonth()+1).padStart(2,'0')}/${dateOnly.getUTCFullYear()}`;
    const formattedTime = `${schedule.startTime} - ${schedule.endTime}`;
    
    const emailSubject = `Confirmação de Agendamento - ${service.name}`;
    const calendarUrls = this.generateAllCalendarUrls({ ...appointment, _overrideStart: startDateTime, _overrideEnd: endDateTime });
    
    const emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 0 auto; background:#f4f6f8; padding:24px;">
        <div style="background:#233142; color:#fff; border-radius:12px 12px 0 0; padding:20px 24px; font-weight:bold; font-size:20px;">
          ✅ Agendamento Confirmado
        </div>
        <div style="background:#fff; border-radius:0 0 12px 12px; box-shadow:0 2px 12px rgba(0,0,0,.06); padding:0 24px 24px;">
          <div style="padding-top:16px; font-size:16px; color:#1f2937;">Olá <strong>${user.name}</strong>!</div>
          <div style="color:#4b5563; margin-bottom:18px;">Seu agendamento foi confirmado com sucesso:</div>

          <div style="background:#eef2f7; border-radius:10px; padding:16px 18px; margin-bottom:22px;">
            <div style="color:#1f2937; font-weight:700; margin-bottom:10px;">🗓️ Detalhes do Agendamento</div>
            <div style="margin:6px 0; color:#111827;"><strong>Serviço:</strong> ${service.name}</div>
            <div style="margin:2px 0; color:#6b7280; font-style:italic;">${service.description || ''}</div>
            <div style="margin:6px 0;"><strong style="color:#6d28d9;">Data:</strong> <span style="color:#6d28d9; font-weight:700;">${formattedDate}</span></div>
            <div style="margin:6px 0;"><strong style="color:#6d28d9;">Horário:</strong> <span style="color:#6d28d9; font-weight:700;">${formattedTime}</span></div>
            <div style="margin:6px 0;"><strong>Valor:</strong> R$ ${service.price.toFixed(2)}</div>
          </div>

          <div style="background:#e3f2fd; border-radius:10px; padding:18px; margin-bottom:22px; text-align:center;">
            <div style="color:#0f3c8a; font-weight:700; margin-bottom:12px;">🗓️ Adicionar ao Calendário</div>
            <div style="display:inline-flex; flex-wrap:wrap; gap:10px; justify-content:center;">
              <a href="${calendarUrls.google}" style="background:#ea4335; color:#fff; padding:10px 16px; border-radius:6px; text-decoration:none; font-weight:600;">🗓️ Google Calendar</a>
              <a href="${calendarUrls.outlook}" style="background:#0078d4; color:#fff; padding:10px 16px; border-radius:6px; text-decoration:none; font-weight:600;">🗓️ Outlook</a>
            </div>
          </div>

          <div style="text-align:center; color:#6b7280; font-size:14px; padding-top:8px;">Obrigado por escolher nossos serviços!<br/>Em caso de dúvidas, entre em contato conosco.</div>
        </div>
      </div>
    `;
    
    const whatsappMessage = `✅ *Agendamento Confirmado!*\n\n` +
      `📋 *Serviço:* ${service.name}\n` +
      `📝 *Descrição:* ${service.description || 'N/A'}\n` +
      `💰 *Preço:* R$ ${service.price.toFixed(2)}\n` +
      `📅 *Data:* ${formattedDate}\n` +
      `⏰ *Horário:* ${formattedTime}\n\n` +
      `Obrigado por escolher nossos serviços!`;
    
    const icsAttachment = this.generateICSAttachment({ ...appointment, _overrideStart: startDateTime, _overrideEnd: endDateTime });
    await this.notificationService.sendEmail(user.email, emailSubject, emailHtml, [icsAttachment]);
    
    if (user.phone) {
      await this.notificationService.sendWhatsApp(user.phone, whatsappMessage);
    }
    
    const notifyAdmin = (process.env.ADMIN_NOTIFICATIONS_ENABLED ?? 'true') !== 'false';
    if (notifyAdmin) {
      const adminSubject = `Novo Agendamento - ${service.name}`;
      const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center; margin-bottom: 30px;">📅 Novo Agendamento Recebido</h2>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196f3;">
            <h3 style="color: #1976d2; margin-top: 0;">Informações do Cliente</h3>
            <p><strong>Nome:</strong> ${user.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${user.email}" style="color: #1976d2;">${user.email}</a></p>
            <p><strong>Telefone:</strong> <a href="tel:${user.phone || ''}" style="color: #1976d2;">${user.phone || 'N/A'}</a></p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #495057; margin-top: 0;">Detalhes do Agendamento</h3>
            <p><strong>Serviço:</strong> ${service.name}</p>
            <p><strong>Descrição:</strong> ${service.description || 'N/A'}</p>
            <p><strong>Preço:</strong> R$ ${service.price.toFixed(2)}</p>
            <p><strong>Data:</strong> ${formattedDate}</p>
            <p><strong>Horário:</strong> ${formattedTime}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">Agendamento criado em ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>
    `;
      const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });
      for (const a of admins) {
        if (a.email) {
          await this.notificationService.sendEmail(a.email, adminSubject, adminHtml);
        }
      }
    }
  }

    private generateAllCalendarUrls(appointment: any): { google: string; outlook: string } {
    const { service, schedule } = appointment;

    const startDateTime: Date = appointment._overrideStart
      ? new Date(appointment._overrideStart)
      : (() => {
          const d = new Date(schedule.date);
          const [h, m] = schedule.startTime.split(':').map(Number);
          d.setHours(h, m, 0, 0);
          return d;
        })();
    const endDateTime: Date = appointment._overrideEnd
      ? new Date(appointment._overrideEnd)
      : (() => {
          const d = new Date(startDateTime);
          const [eh, em] = schedule.endTime.split(':').map(Number);
          d.setHours(eh, em, 0, 0);
          return d;
        })();

    const title = `Agendamento - ${service.name}`;
    const details = `Serviço: ${service.name}\nDescrição: ${service.description || 'N/A'}\nPreço: R$ ${service.price.toFixed(2)}`;
    const location = 'Local do atendimento';
    
    const startDate = startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;

    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${startDate}&enddt=${endDate}&body=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;

    return {
      google: googleUrl,
      outlook: outlookUrl
    };
  }

  private generateCalendarUrl(appointment: any): string {
    return this.generateAllCalendarUrls(appointment).google;
  }

  private generateICSFile(appointment: any, startDateTime: Date, endDateTime: Date, title: string, details: string, location: string): string {
    const { service, schedule } = appointment;
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sistema de Agendamento//PT-BR',
      'BEGIN:VEVENT',
      `UID:${appointment.id}@sistema-agendamento.com`,
      `DTSTART:${formatDate(startDateTime)}`,
      `DTEND:${formatDate(endDateTime)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${details.replace(/\n/g, '\\n')}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Lembrete do agendamento',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
  }

  private generateICSAttachment(appointment: any): { filename: string; content: string; contentType: string } {
    const { service, schedule } = appointment;
    const start: Date = appointment._overrideStart ? new Date(appointment._overrideStart) : new Date(schedule.date);
    const end: Date = appointment._overrideEnd ? new Date(appointment._overrideEnd) : new Date(start);
    const title = `Agendamento - ${service.name}`;
    const details = `Serviço: ${service.name}\nDescrição: ${service.description || 'N/A'}\nPreço: R$ ${service.price.toFixed(2)}`;
    const location = 'Barbearia Jhony';
    
    const content = this.createICSContent(title, details, location, start, end, appointment.id);
    return { filename: 'SeuAgendamento.ics', content, contentType: 'text/calendar;charset=utf-8' };
  }

  private createICSContent(title: string, details: string, location: string, start: Date, end: Date, uid: number): string {
    const format = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sistema de Agendamento//PT-BR',
      'BEGIN:VEVENT',
      `UID:${uid}@sistema-agendamento.com`,
      `DTSTART:${format(start)}`,
      `DTEND:${format(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${details.replace(/\n/g, '\\n')}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }
}
