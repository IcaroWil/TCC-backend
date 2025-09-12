import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ServicesModule } from '../services/services.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { NotificationService } from '../common/notifications/notification.service';

@Module({
  imports: [PrismaModule, UsersModule, ServicesModule, SchedulesModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, NotificationService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

