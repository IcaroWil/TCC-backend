import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { GenerateSchedulesDto } from './dto/generate-schedules.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    const { name, description, price, duration, interval, startTime, endTime, daysOfWeek } = createServiceDto;
  
    return this.prisma.service.create({
      data: {
        name,
        description,
        price,
        duration,
        interval,
        startTime,
        endTime,
        daysOfWeek: daysOfWeek ?? ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      },
    });
  }

  async findAll() {
    return this.prisma.service.findMany();
  }

  async findOne(id: number) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: number, data: Partial<CreateServiceDto>) {
    await this.findOne(id);
    return this.prisma.service.update({
      where: { id },
      data: {
        ...data,
        daysOfWeek: data.daysOfWeek ?? ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.service.delete({ where: { id } });
  }

  async generateSchedules(serviceId: number, generateSchedulesDto: GenerateSchedulesDto) {
    const service = await this.findOne(serviceId);
    
    const { startDate, endDate, startTime, endTime, duration, interval, daysOfWeek } = generateSchedulesDto;
    
    
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    if (start >= end) {
      throw new BadRequestException('Start time must be before end time');
    }
    
    if (duration > (end - start)) {
      throw new BadRequestException('Duration cannot be greater than the time range');
    }
    
    const schedules: any[] = [];
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    
    for (let date = new Date(startDateObj); date <= endDateObj; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = this.getDayOfWeek(date);
      
      if (daysOfWeek.includes(dayOfWeek as any)) {
        const daySchedules = this.generateDaySchedules(
          serviceId,
          new Date(date),
          startTime,
          endTime,
          duration,
          interval
        );
        schedules.push(...daySchedules);
      }
    }
    
    const createdSchedules: any[] = [];
    for (const schedule of schedules) {
      try {
        
        const existing = await this.prisma.schedule.findFirst({
          where: {
            serviceId: (schedule as any).serviceId,
            date: (schedule as any).date,
            startTime: (schedule as any).startTime
          } as any
        });

        if (!existing) {
          const created = await this.prisma.schedule.create({
            data: schedule as any
          });
          createdSchedules.push(created);
        } else {
          
          const updated = await this.prisma.schedule.update({
            where: { id: existing.id },
            data: {
              endTime: (schedule as any).endTime,
              isAvailable: true
            } as any
          });
          createdSchedules.push(updated);
        }
      } catch (error) {
        console.log(`Error creating schedule for ${(schedule as any).date} ${(schedule as any).startTime}:`, error);
      }
    }
    
    return {
      message: `Generated ${createdSchedules.length} schedules for service "${service.name}"`,
      count: createdSchedules.length,
      schedules: createdSchedules
    };
  }

  private generateDaySchedules(
    serviceId: number,
    date: Date,
    startTime: string,
    endTime: string,
    duration: number,
    interval: number
  ) {
    const schedules: any[] = [];
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    for (let time = start; time + duration <= end; time += interval) {
      const startTimeStr = this.minutesToTime(time);
      const endTimeStr = this.minutesToTime(time + duration);
      
      schedules.push({
        serviceId,
        date: new Date(date),
        startTime: startTimeStr,
        endTime: endTimeStr,
        isAvailable: true
      });
    }
    
    return schedules;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private getDayOfWeek(date: Date): string {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
  }
}