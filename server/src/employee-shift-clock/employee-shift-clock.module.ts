import { Module } from '@nestjs/common';
import { EmployeeShiftClockService } from './employee-shift-clock.service';
import { EmployeeShiftClockController } from './employee-shift-clock.controller';
import { PrismaService } from 'src/prisma.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [EmployeeShiftClockController],
  providers: [EmployeeShiftClockService, PrismaService, RolesGuard],
})
export class EmployeeShiftClockModule {}
