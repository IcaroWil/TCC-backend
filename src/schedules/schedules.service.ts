import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

function parseDateOnly(input: string): Date | null {
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

  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const m1 = input.match(dmy);
  if (m1) {
    const d = Number(m1[1]);
    const m = Number(m1[2]);
    const y = Number(m1[3]);
    return new Date(y, m - 1, d);
  }
  return null;
}

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(createScheduleDto: CreateScheduleDto) {
    if (!/^([0-1]\d|2[0-3]):([0-5]\d)$/.test(createScheduleDto.startTime) || !/^([0-1]\d|2[0-3]):([0-5]\d)$/.test(createScheduleDto.endTime)) {
      throw new BadRequestException('Invalid time format, expected HH:mm');
    }
    return this.prisma.schedule.create({
      data: {
        serviceId: createScheduleDto.serviceId,
        date: new Date(createScheduleDto.date),
        startTime: createScheduleDto.startTime,
        endTime: createScheduleDto.endTime,
        isAvailable: true,
      } as any,
    });
  }

  async findAll(filter?: { serviceId?: number; date?: string; available?: boolean }) {
    const where: any = {};
    
    if (filter?.serviceId) {
      where.serviceId = filter.serviceId;
    }
    
    if (filter?.date) {
      const day = parseDateOnly(filter.date);
      if (!day) {
        throw new BadRequestException('Invalid date. Use YYYY-MM-DD, DD/MM/YYYY, or ISO date.');
      }
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      where.date = { gte: day, lt: next };
    }
    
    if (filter?.available === true) {
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
        appointments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        }
      } as any,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: number) {
    const schedule = await this.prisma.schedule.findUnique({ 
      where: { id },
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
        appointments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        }
      }
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async update(id: number, data: Partial<CreateScheduleDto>) {
    await this.findOne(id);
    return this.prisma.schedule.update({
      where: { id },
      data: {
        ...(data.date ? { date: new Date(data.date) } : {}),
        ...(data.startTime ? { startTime: data.startTime } : {}),
        ...(data.endTime ? { endTime: data.endTime } : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.schedule.delete({ where: { id } });
  }
}