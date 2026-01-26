import { Module } from '@nestjs/common';
import { EmployeeShiftsService } from './employee-shifts.service';
import { EmployeeShiftsController } from './employee-shifts.controller';
import { PrismaService } from 'src/prisma.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [EmployeeShiftsController],
  providers: [EmployeeShiftsService, PrismaService, RolesGuard],
})
export class EmployeeShiftsModule {}
