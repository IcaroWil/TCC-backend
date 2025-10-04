import { Controller, Post, Body, UseGuards, Request, Get, Param, ParseIntPipe, Query, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      example: {
        scheduleId: 1,
        serviceId: 2,
        addToCalendar: true, // Consentimento explícito para LGPD
      },
    },
  })
  @Post()
  async create(@Request() req, @Body() dto: CreateAppointmentDto) {
    const appointment = await this.appointmentsService.create(req.user.userId ?? req.user.id, dto);
    
    const response: any = {
      ...appointment,
      message: dto.addToCalendar 
        ? "Agendamento criado com sucesso! Email enviado + link para calendário disponível."
        : "Agendamento criado com sucesso! Verifique seu email para adicionar ao calendário."
    };

    if (dto.addToCalendar) {
      const startDateTime = new Date(appointment.schedule.date);
      const [startHour, startMinute] = appointment.schedule.startTime.split(':');
      const [endHour, endMinute] = appointment.schedule.endTime.split(':');
      
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
      
      const formatDateForCalendar = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      const eventTitle = `${appointment.service.name} - Agendamento`;
      const eventDescription = `${appointment.service.description || ''}\n\nValor: R$ ${appointment.service.price.toFixed(2)}\n\nSistema de Agendamento Online`;
      
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatDateForCalendar(startDateTime)}/${formatDateForCalendar(endDateTime)}&details=${encodeURIComponent(eventDescription)}`;
      
      response.calendarUrl = googleCalendarUrl;
      response.calendarDirect = true;
    }

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Max items to return (default 50)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Items to skip (default 0)' })
  @Get()
  findMany(@Request() req, @Query('take') take?: string, @Query('skip') skip?: string) {
    const user = req.user;
    return this.appointmentsService.findMany(user, Number(take ?? 50), Number(skip ?? 0));
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateAppointmentStatusDto
  ) {
    return this.appointmentsService.updateStatus(id, updateData.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id/cancel')
  async cancelAppointment(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.updateStatus(id, 'CANCELLED');
  }
}

