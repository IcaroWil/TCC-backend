import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { NotificationService } from '../common/notifications/notification.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicController],
  providers: [PublicService, NotificationService],
})
export class PublicModule {}
