import { Module } from '@nestjs/common';
import { EmployeeShiftClockServiceById } from './employee-shift-clock-by-id.service';
import { EmployeeShiftClockControllerById } from './employee-shift-clock-by-id.controller';
import { PrismaService } from 'src/prisma.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [EmployeeShiftClockControllerById],
  providers: [EmployeeShiftClockServiceById, PrismaService, RolesGuard],
})
export class EmployeeShiftClockModuleById {}
