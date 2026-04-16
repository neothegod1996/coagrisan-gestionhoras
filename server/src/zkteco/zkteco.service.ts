import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as dayjs from 'dayjs';

@Injectable()
export class ZktecoService {
  private readonly logger = new Logger(ZktecoService.name);

  constructor(private readonly prisma: PrismaService) { }

  async processAttendanceLogs(serialNumber: string, rawData: string) {
    const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 2) continue;

      const devicePin = parts[0];
      const timeString = parts[1];
      const time = dayjs(timeString).toDate();

      console.log(`Received log from device ${serialNumber}: PIN=${devicePin}, Time=${time}`);

      await this.handleZktecoClocking(devicePin, time, serialNumber);
    }
  }

  private async handleZktecoClocking(devicePin: string, time: Date, serialNumber: string) {
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

    // 3. Lógica de Sincronización (Similar a tu TaskTrackerService)
    await this.prisma.$transaction(async (tx) => {
      // ¿Hay una tarea/jornada abierta para este empleado?
      const runningTask = await tx.task_tracker.findFirst({
        where: {
          employee_id: employee.id,
          status: { in: ['pending', 'running'] },
          end_time: null,
        },
        orderBy: { created_at: 'desc' },
      });

      // Obtener o Crear el Shift del día
      const employeeShift = await this.getOrCreateShift(tx, employee, time);

      if (runningTask) {
        // --- CLOCK OUT ---
        const duration = dayjs(time).diff(dayjs(runningTask.start_time), 'seconds');

        // Actualizar tarea
        await tx.task_tracker.update({
          where: { id: runningTask.id },
          data: {
            end_time: time,
            duration,
            status: 'completed',
            updated_at: new Date()
          },
        });

        // Crear marcación de salida
        await tx.employee_shift_clock.create({
          data: {
            employee_shift_id: employeeShift.id,
            terminal_id: terminal.id,
            time: time,
            status: 'pending', // O 'approved' según tu regla de negocio
            session_id: runningTask.id,
            created_at: time,
          },
        });

        this.logger.log(`Clock OUT: Employee ${employee.id} finished task ${runningTask.id}`);
      } else {
        // --- CLOCK IN ---
        // Crear nueva tarea
        const newTask = await tx.task_tracker.create({
          data: {
            employee_id: employee.id,
            name: 'Jornada ZKTeco',
            description: `Iniciado automáticamente desde terminal ${serialNumber}`,
            start_time: time,
            status: 'running',
            created_at: time,
          },
        });

        // Crear marcación de entrada
        await tx.employee_shift_clock.create({
          data: {
            employee_shift_id: employeeShift.id,
            terminal_id: terminal.id,
            time: time,
            status: 'pending',
            session_id: newTask.id,
            created_at: time,
          },
        });

        this.logger.log(`Clock IN: Employee ${employee.id} started new task ${newTask.id}`);
      }
    });
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