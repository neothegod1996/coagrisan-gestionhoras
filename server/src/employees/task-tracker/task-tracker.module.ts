import { Module } from '@nestjs/common';
import { TaskTrackerService } from './task-tracker.service';
import { TaskTrackerController } from './task-tracker.controller';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [TaskTrackerController],
  providers: [TaskTrackerService, PrismaService, RolesGuard],
})
export class TaskTrackerModule {}
