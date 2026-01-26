import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { PrismaService } from 'src/prisma.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { TurnoverModule } from './turnover/turnover.module';
import { TaskTrackerModule } from './task-tracker/task-tracker.module';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, PrismaService, RolesGuard],
  imports: [TurnoverModule, TaskTrackerModule],
})
export class EmployeesModule {}
