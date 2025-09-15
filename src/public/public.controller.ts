import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { CreateGuestAppointmentDto } from './dto/create-guest-appointment.dto';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Get('services')
  @ApiOperation({ summary: 'Get all available services' })
  @ApiResponse({ status: 200, description: 'List of services' })
  getServices() {
    return this.publicService.getServices();
  }

  @Get('services/:id/schedules')
  @ApiOperation({ summary: 'Get available schedules for a service' })
  @ApiResponse({ status: 200, description: 'List of available schedules' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'available', required: false, description: 'Filter only available slots', type: Boolean })
  getServiceSchedules(
    @Param('id', ParseIntPipe) serviceId: number,
    @Query('date') date?: string,
    @Query('available') available?: boolean
  ) {
    return this.publicService.getServiceSchedules(serviceId, date, available);
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Create a guest appointment (no login required)' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or time slot not available' })
  @ApiResponse({ status: 404, description: 'Service or schedule not found' })
  createGuestAppointment(@Body() createGuestAppointmentDto: CreateGuestAppointmentDto) {
    return this.publicService.createGuestAppointment(createGuestAppointmentDto);
  }
}
