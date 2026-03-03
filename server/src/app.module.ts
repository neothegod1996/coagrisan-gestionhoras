import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LocationsModule } from './locations/locations.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ProfilesModule } from './profiles/profiles.module';
import { EmployeesModule } from './employees/employees.module';
import { EmployeeShiftsModule } from './employee-shifts/employee-shifts.module';
import { IncidencesModule } from './incidences/incidences.module';
import { TerminalsModule } from './terminals/terminals.module';
import { ReportsModule } from './reports/reports.module';
import { TaskTrackerModule } from './employees/task-tracker/task-tracker.module';
import { PartnersModule } from './partners/partners.module';
import { EmployeeShiftClockModule } from './employee-shift-clock/employee-shift-clock.module';
import { EmployeeShiftClockModuleById } from './employee-shift-clock-by-id/employee-shift-clock-by-id.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 60,
        },
      ],
      errorMessage:
        "Estas haciendo demasiadas peticiones, espera un momento y vuelve a intentarlo",
    }),
    AuthModule,
    UsersModule,
    LocationsModule,
    SchedulesModule,
    ProfilesModule,
    EmployeesModule,
    EmployeeShiftsModule,
    EmployeeShiftClockModuleById,
    IncidencesModule,
    TerminalsModule,
    ReportsModule,
    TaskTrackerModule,
    PartnersModule,
    EmployeeShiftClockModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
