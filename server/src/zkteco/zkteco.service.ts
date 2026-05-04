import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TaskTrackerService } from '../employees/task-tracker/task-tracker.service';
import * as dayjs from 'dayjs';

@Injectable()
export class ZktecoService {
  private readonly logger = new Logger(ZktecoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taskTrackerService: TaskTrackerService
  ) { }

  async processAttendanceLogs(serialNumber: string, rawData: string, ipAddress?: string) {
    const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 2) continue;

      const devicePin = parts[0];
      const timeString = parts[1];
      const status = parts[2]; // 0: Check-In, 1: Check-Out (estándar ADMS)
      const verifyMode = parts[3];

      const time = dayjs(timeString).toDate();

      this.logger.log(`Log from SN ${serialNumber}: PIN=${devicePin}, Time=${time}, Status=${status}, Mode=${verifyMode}, IP=${ipAddress}`);

      await this.handleZktecoClocking(devicePin, time, serialNumber, status, ipAddress);
    }
  }

  private async handleZktecoClocking(devicePin: string, time: Date, serialNumber: string, deviceStatus?: string, ipAddress?: string) {
    // 1. Identificación del empleado (Lógica de tu primer script)
    let employee = await this.prisma.employee.findFirst({
      where: { device_pin: devicePin, status: 'active' },
      include: { schedule: true },
    });

    console.log(`Processing clocking for PIN: ${devicePin} at ${time} from device ${serialNumber}`);

    if (!employee) {
      employee = await this.prisma.employee.findFirst({
        where: { card_id: devicePin, status: 'active', device_pin: null },
        include: { schedule: true },
      });

      if (employee) {
        await this.prisma.employee.update({
          where: { id: employee.id },
          data: { device_pin: devicePin },
        });
      }
    }

    if (!employee) {
      this.logger.warn(`No employee found for PIN: ${devicePin}`);
      return;
    }

    // 2. Identificación de la Terminal
    const terminal = await this.getTerminal(serialNumber, employee.partner_id);
    if (!terminal) return;

    // 3. Decisión de Marcación (Basada en dispositivo o alternancia)
    await this.prisma.$transaction(async (tx) => {
      const runningTask = await tx.task_tracker.findFirst({
        where: {
          employee_id: employee.id,
          status: { in: ['pending', 'running'] },
          end_time: null,
        },
        orderBy: { created_at: 'desc' },
      });

      const employeeShift = await this.getOrCreateShift(tx, employee, time);

      // Determinar acción
      let action: 'IN' | 'OUT' | 'NONE' = 'NONE';
      
      if (deviceStatus === '0') { // Check-In explícito
        action = runningTask ? 'NONE' : 'IN';
      } else if (deviceStatus === '1') { // Check-Out explícito
        action = runningTask ? 'OUT' : 'NONE';
      } else { // Sin estado claro -> Alternar (Toggle)
        action = runningTask ? 'OUT' : 'IN';
      }

      if (action === 'NONE') {
        this.logger.log(`Action ${deviceStatus === '0' ? 'IN' : 'OUT'} ignored for employee ${employee.id} (already in that state)`);
        return;
      }

      // --- SNAPSHOTS AUDIT ---
      const snapshots = await this.taskTrackerService.getTrackSnapshots(employee.id, time);

      if (action === 'OUT' && runningTask) {
        // --- CLOCK OUT ---
        const roundedEndTime = this.roundEndTime(time);
        const duration = dayjs(roundedEndTime).diff(dayjs(runningTask.start_time), 'seconds');

        await tx.task_tracker.update({
          where: { id: runningTask.id },
          data: {
            end_time: roundedEndTime,
            duration: Math.max(0, duration),
            status: 'completed',
            ip_address: ipAddress,
            terminal_id: terminal.id,
            updated_at: new Date()
          },
        });

        await tx.employee_shift_clock.create({
          data: {
            employee_shift_id: employeeShift.id,
            terminal_id: terminal.id,
            time: time, // Guardamos la hora REAL del fichaje en el log
            status: 'pending',
            session_id: runningTask.id,
            ip_address: ipAddress,
            created_at: time,
          },
        });

        this.logger.log(`Clock OUT: Employee ${employee.id} finished task ${runningTask.id} (Rounded: ${roundedEndTime}, Duration: ${duration}s)`);
      } else {
        // --- CLOCK IN ---
        const roundedStartTime = this.roundStartTime(time);
        const newTask = await tx.task_tracker.create({
          data: {
            employee_id: employee.id,
            name: 'Jornada ZKTeco',
            description: `Iniciado automáticamente (SN: ${serialNumber}, Status: ${deviceStatus || 'Toggle'})`,
            start_time: roundedStartTime,
            status: 'running',
            ip_address: ipAddress,
            terminal_id: terminal.id,
            schedule_snapshot_id: snapshots.activeScheduleId,
            schedule_snapshot_name: snapshots.activeScheduleName,
            agreement_snapshot_id: snapshots.agreementId,
            agreement_snapshot_name: snapshots.agreementName,
            created_at: time,
          },
        });

        await tx.employee_shift_clock.create({
          data: {
            employee_shift_id: employeeShift.id,
            terminal_id: terminal.id,
            time: time, // Guardamos la hora REAL del fichaje
            status: 'pending',
            session_id: newTask.id,
            ip_address: ipAddress,
            created_at: time,
          },
        });

        this.logger.log(`Clock IN: Employee ${employee.id} started new task ${newTask.id} (Rounded: ${roundedStartTime})`);
      }
    });
  }

  private roundStartTime(date: Date): Date {
    const d = dayjs(date);
    const minutes = d.minute();
    if (minutes <= 15) {
      return d.startOf('hour').toDate();
    } else {
      return d.add(1, 'hour').startOf('hour').toDate();
    }
  }

  private roundEndTime(date: Date): Date {
    const d = dayjs(date);
    const minutes = d.minute();
    if (minutes >= 45) {
      return d.add(1, 'hour').startOf('hour').toDate();
    } else {
      return d.startOf('hour').toDate();
    }
  }

  // --- Helpers Reutilizables ---

  private async getOrCreateShift(tx: any, employee: any, time: Date) {
    console.log(`Looking for shift for employee ${employee.id} on date ${dayjs(time).format('YYYY-MM-DD')}`);

    let shift = await tx.employee_shift.findFirst({
      where: {
        employee_id: employee.id,
        date: {
          gte: dayjs(time).startOf('day').toDate(),
          lte: dayjs(time).endOf('day').toDate(),
        },
      },
    });

    if (!shift) {
      const scheduleSession = employee.schedule_id
        ? await this.getClosestScheduleSession(employee.schedule_id, time)
        : null;

      shift = await tx.employee_shift.create({
        data: {
          employee_id: employee.id,
          date: dayjs(time).startOf('day').toDate(),
          schedule_session_id: scheduleSession?.id,
        },
      });
    }
    return shift;
  }

  private async getTerminal(sn: string, partnerId: string) {
    console.log(`Looking for terminal with SN: ${sn} for partner ${partnerId}`);

    let terminal = await this.prisma.terminal.findFirst({ where: { external_id: sn } });
    if (!terminal) {
      terminal = await this.prisma.terminal.findFirst({
        where: { partner_id: partnerId },
        orderBy: { created_at: 'asc' },
      });
    }
    if (!terminal) {
      terminal = await this.prisma.terminal.findFirst({ orderBy: { created_at: 'asc' } });
    }
    if (!terminal) this.logger.error('No terminals configured in DB');
    return terminal;
  }

  private async getClosestScheduleSession(schedule_id: string, taskTime: Date) {
    console.log(`Looking for schedule session for schedule ${schedule_id} around time ${taskTime}`);

    const session = await this.prisma.schedule_session.findFirst({
      where: { schedule_id, start_time: { lte: taskTime } },
      orderBy: { start_time: 'desc' },
    });
    return session || this.prisma.schedule_session.findFirst({
      where: { schedule_id },
      orderBy: { start_time: 'asc' },
    });
  }
}