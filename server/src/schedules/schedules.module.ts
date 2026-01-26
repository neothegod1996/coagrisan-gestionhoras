import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { PrismaService } from 'src/prisma.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService, PrismaService, RolesGuard],
})
export class SchedulesModule {}
