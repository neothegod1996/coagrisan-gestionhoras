import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTaskTrackerDto } from './dto/create-task-tracker.dto';
import { UpdateTaskTrackerDto } from './dto/update-task-tracker.dto';
import { PaginationTaskTrackerDto } from './dto/pagination-task-tracker.dto';
import { PrismaService } from 'src/prisma.service';
import { User } from 'src/types';
import * as dayjs from 'dayjs';
import { role } from '@prisma/client';

@Injectable()
export class TaskTrackerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateTaskTrackerDto, user: User, ip?: string) {
    const employeeId = await this.ensureEmployeeId(user);


    const partner_id = user.partner_id;


    let startTime: Date | null = null;
    if (body.start_time) {
      startTime = this.roundStartTime(new Date(body.start_time));
    } else if (body.status === 'running') {
      startTime = this.roundStartTime(new Date());
    }

    console.log(`TASK CREATE: Status=${body.status}, Original=${body.start_time || 'now'} -> Result=${startTime}`);

    const employee = await this.prisma.employee.findFirst({
      where: {
        id: employeeId,
        // partner_id,
      },
      include: { schedule: true },
    });

    if (!employee) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }

    if (employee.status !== 'active') {
      throw new HttpException('El empleado no está en estado Alta/Activo', HttpStatus.FORBIDDEN);
    }

    const employeePartnerId = employee.partner_id;


    // Capture Snapshots
    const referenceDate = startTime || new Date();
    const snapshots = await this.getTrackSnapshots(employee.id, referenceDate);

    const employeeShiftData = {
      employee_id: employee.id,
      date: referenceDate,
      schedule_session_id: snapshots.scheduleSessionId,
    };

    return this.prisma.$transaction(async (tx) => {
      const taskTracker = await tx.task_tracker.create({
        data: {
          ...body,
          start_time: startTime, // Puede ser null
          employee_id: employee.id,
          schedule_snapshot_id: snapshots.activeScheduleId,
          schedule_snapshot_name: snapshots.activeScheduleName,
          agreement_snapshot_id: snapshots.agreementId,
          agreement_snapshot_name: snapshots.agreementName,
          ip_address: ip,
          latitude: body.latitude,
          longitude: body.longitude,
          terminal_id: body.terminal_id,
        },
      });

      let employeeShift = await tx.employee_shift.findFirst({
        where: {
          employee_id: employee.id,
          date: {
            gte: dayjs(referenceDate).startOf('day').toDate(),
            lte: dayjs(referenceDate).endOf('day').toDate(),
          },
        },
      });

      if (!employeeShift) {
        employeeShift = await tx.employee_shift.create({
          data: employeeShiftData,
        });
      }

      let terminal = await tx.terminal.findFirst({
        where: { partner_id: employeePartnerId },
        orderBy: { created_at: 'asc' },
      });

      if (!terminal) {
        terminal = await tx.terminal.findFirst({
          orderBy: { created_at: 'asc' },
        });
      }

      if (!terminal) {
        throw new HttpException('Terminal not found', HttpStatus.BAD_REQUEST);
      }

      await tx.employee_shift_clock.create({
        data: {
          employee_shift_id: employeeShift.id,
          terminal_id: terminal.id,
          time: referenceDate,
          status: 'pending',
          session_id: taskTracker.id,
        },
      });

      return taskTracker;
    });
  }

  async findAll(query: PaginationTaskTrackerDto, user: User) {
    const employeeId = await this.ensureEmployeeId(user);

    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    let where: any = {};
    if (status) where.status = status;
    if (employeeId) where.employee_id = employeeId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        {
          employee: {
            OR: [
              { first_name: { contains: search } },
              { last_name: { contains: search } },
              { email: { contains: search } },
            ],
          },
        },
      ];
    }

    const [taskTrackers, count] = await this.prisma.$transaction([
      this.prisma.task_tracker.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          schedule_snapshot: {
            select: {
              id: true,
              name: true,
            }
          },
          agreement_snapshot: {
            select: {
              id: true,
              name: true,
            }
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.task_tracker.count({ where }),
    ]);

    const taskTrackerIds = taskTrackers.map((t) => t.id);
    const historyFlags = await this.prisma.task_tracker_history.findMany({
      where: { task_tracker_id: { in: taskTrackerIds } },
      select: { task_tracker_id: true, start_time_modified: true, end_time_modified: true },
    });

    const data = taskTrackers.map((task) => {
      const taskHistory = historyFlags.filter((h) => h.task_tracker_id === task.id);
      return {
        ...task,
        start_time_modified: taskHistory.some((h) => h.start_time_modified),
        end_time_modified: taskHistory.some((h) => h.end_time_modified),
      };
    });

    return {
      data,
      total: count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: string, user: User) {
    const employeeId = await this.ensureEmployeeId(user);

    const taskTracker = await this.prisma.task_tracker.findFirst({
      where: {
        id,
        employee_id: employeeId,
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            profile: {
              select: {
                id: true,
                name: true,
              },
            },
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        schedule_snapshot: {
          select: {
            id: true,
            name: true,
          }
        },
        agreement_snapshot: {
          select: {
            id: true,
            name: true,
          }
        },
      },
    });

    if (!taskTracker) {
      throw new HttpException('Task tracker not found', HttpStatus.NOT_FOUND);
    }

    return taskTracker;
  }

  async update(id: string, body: UpdateTaskTrackerDto, user: User) {
    const employeeId = await this.ensureEmployeeId(user);

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task_tracker.findFirst({
        where: { id, employee_id: employeeId },
      });

      if (!task) {
        throw new HttpException('Task tracker not found', HttpStatus.NOT_FOUND);
      }

      const updateData: any = { ...body };

      let startHasChanged = false;
      let endHasChanged = false;

      if (body.start_time) {
        const newStartTime = this.roundStartTime(new Date(body.start_time));
        console.log(`TASK UPDATE START: Original ${body.start_time} -> Rounded ${newStartTime}`);
        if (task.start_time && !dayjs(newStartTime).isSame(dayjs(task.start_time))) {
          startHasChanged = true;
        }
        updateData.start_time = newStartTime;
      }

      if (body.end_time) {
        const newEndTime = this.roundEndTime(new Date(body.end_time));
        console.log(`TASK UPDATE END: Task=${id}, Employee=${employeeId}, Rounded=${newEndTime}`);
        if (task.end_time && !dayjs(newEndTime).isSame(dayjs(task.end_time))) {
          endHasChanged = true;
        }
        updateData.end_time = newEndTime;
      }

      // Recalculate duration if we have both values
      let currentStart = updateData.start_time || task.start_time;
      let currentEnd = updateData.end_time || task.end_time;
      
      if (currentStart && currentEnd) {
        updateData.duration = dayjs(currentEnd).diff(dayjs(currentStart), 'seconds');
      }

      // CAPTURE SNAPSHOTS IF STARTING (turning to running)
      if (updateData.status === 'running' || (body.start_time && !task.start_time)) {
        const referenceRoundingDate = updateData.start_time || new Date();
        const snapshots = await this.getTrackSnapshots(employeeId, referenceRoundingDate);
        
        updateData.schedule_snapshot_id = snapshots.activeScheduleId;
        updateData.schedule_snapshot_name = snapshots.activeScheduleName;
        updateData.agreement_snapshot_id = snapshots.agreementId;
        updateData.agreement_snapshot_name = snapshots.agreementName;
        
        console.log(`SNAPSHOTS CAPTURED ON START: Schedule=${snapshots.activeScheduleName}, Agreement=${snapshots.agreementName}`);
      }

      const taskTracker = await tx.task_tracker.update({
        where: { id },
        data: {
          ...updateData,
          // Forzamos el uso de los valores procesados (redondeados)
          ...(updateData.start_time && { start_time: updateData.start_time }),
          ...(updateData.end_time && { end_time: updateData.end_time }),
        },
      });

      if (startHasChanged || endHasChanged) {
        await tx.task_tracker_history.create({
          data: {
            task_tracker_id: id,
            user_id: user.id,
            start_time_modified: startHasChanged,
            end_time_modified: endHasChanged,
          },
        });
      }

      if (!body.end_time) {
        return taskTracker;
      }

      const taskEndTime = new Date(body.end_time);

      // Attempt to find shift from the initial clock-in of this task
      const startClock = await tx.employee_shift_clock.findFirst({
        where: { session_id: id },
      });

      let employeeShiftId = startClock?.employee_shift_id;

      if (!employeeShiftId) {
        // Fallback: search by end_time day
        const existingShift = await tx.employee_shift.findFirst({
          where: {
            employee_id: employeeId,
            date: {
              gte: dayjs(taskEndTime).startOf('day').toDate(),
              lte: dayjs(taskEndTime).endOf('day').toDate(),
            },
          },
        });
        employeeShiftId = existingShift?.id;
      }

      if (!employeeShiftId) {
        // Fallback: Create a shift if still not found (similar to create logic)
        const employee = await tx.employee.findFirst({
          where: { id: employeeId },
          include: { schedule: true },
        });

        const scheduleSession = employee?.schedule_id
          ? await this.getClosestScheduleSession(employee.schedule_id, taskEndTime)
          : null;

        const newShift = await tx.employee_shift.create({
          data: {
            employee_id: employeeId,
            date: taskEndTime,
            schedule_session_id: scheduleSession?.id,
          },
        });
        employeeShiftId = newShift.id;
      }

      let terminal: any = null;
      
      if (user.partner_id) {
        terminal = await tx.terminal.findFirst({
          where: { partner_id: user.partner_id },
          orderBy: { created_at: 'asc' },
        });
      }

      if (!terminal) {
        terminal = await tx.terminal.findFirst({
          orderBy: { created_at: 'asc' },
        });
      }

      if (!terminal) {
        throw new HttpException('Terminal not found', HttpStatus.BAD_REQUEST);
      }

      await tx.employee_shift_clock.create({
        data: {
          employee_shift_id: employeeShiftId,
          terminal_id: terminal.id,
          time: taskEndTime,
          status: 'pending',
          session_id: task.id,
        },
      });

      return taskTracker;
    });
  }


  async remove(id: string, user: User) {
    const employeeId = await this.ensureEmployeeId(user);

    const taskTracker = await this.prisma.task_tracker.findFirst({
      where: {
        id,
        employee_id: employeeId,
      },
      select: { id: true },
    });

    if (!taskTracker) {
      throw new HttpException('Task tracker not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.task_tracker.delete({
      where: { id },
    });
  }



  async getClosestScheduleSession(
    schedule_id: string,
    taskTime: Date
  ) {
    // Preferimos sesiones que ya hayan empezado
    const session = await this.prisma.schedule_session.findFirst({
      where: {
        schedule_id,
        start_time: {
          lte: taskTime,
        },
      },
      orderBy: {
        start_time: 'desc',
      },
    });

    if (session) return session;

    // Fallback: la más cercana por arriba
    return this.prisma.schedule_session.findFirst({
      where: { schedule_id },
      orderBy: {
        start_time: 'asc',
      },
    });
  }

  public async getTrackSnapshots(employeeId: string, referenceDate: Date) {
    console.log(`DEBUG SNAPSHOTS: Starting for Employee=${employeeId}, Date=${referenceDate.toISOString()}`);
    
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId },
      include: { schedule: true },
    });

    if (!employee) {
      console.log(`DEBUG SNAPSHOTS: Employee NOT found!`);
      return {};
    }

    console.log(`DEBUG SNAPSHOTS: Employee Base Schedule: ID=${employee.schedule_id}, Name=${employee.schedule?.name}`);

    const activeSchedules = await this.prisma.employee_schedule.findMany({
      where: {
        employee_id: employeeId,
        start_date: { lte: referenceDate },
        OR: [
          { end_date: null },
          { end_date: { gte: referenceDate } },
        ],
      },
      include: {
        schedule: true
      },
      orderBy: { start_date: 'desc' },
    });

    console.log(`DEBUG SNAPSHOTS: Found ${activeSchedules.length} dynamic schedules.`);

    let activeScheduleId = employee.schedule_id;
    let activeScheduleName = employee.schedule?.name;
    let scheduleSessionId: string | null = null;

    if (activeSchedules.length > 0) {
      const dynamicSchedule = activeSchedules[0];
      activeScheduleId = dynamicSchedule.schedule_id;
      activeScheduleName = dynamicSchedule.schedule?.name;
      
      console.log(`DEBUG SNAPSHOTS: Using Dynamic Schedule: ${activeScheduleName}`);
      const session = await this.getClosestScheduleSession(dynamicSchedule.schedule_id, referenceDate);
      if (session) {
        scheduleSessionId = session.id;
      }
    } else if (employee.schedule_id) {
       console.log(`DEBUG SNAPSHOTS: Falling back to base schedule: ${employee.schedule?.name}`);
       const session = await this.getClosestScheduleSession(employee.schedule_id, referenceDate);
       scheduleSessionId = session?.id || null;
    }

    const employeeAgreement = await this.prisma.employee_agreement.findFirst({
      where: { employee_id: employeeId },
      include: { agreement: true },
      orderBy: { created_at: 'desc' }
    });

    if (employeeAgreement) {
      console.log(`DEBUG SNAPSHOTS: Agreement found: ${employeeAgreement.agreement?.name}`);
    } else {
      console.log(`DEBUG SNAPSHOTS: No agreement found for employee.`);
    }

    return {
      activeScheduleId,
      activeScheduleName,
      scheduleSessionId,
      agreementId: employeeAgreement?.agreement_id,
      agreementName: employeeAgreement?.agreement?.name,
    };
  }

  private async ensureEmployeeId(user: User): Promise<string> {
    let employeeId = user.employee?.id;

    if (!employeeId) {
      const dbEmployee = await this.prisma.employee.findFirst({
        where: { user_id: user.id }
      });
      if (dbEmployee) {
        employeeId = dbEmployee.id;
      } else if (user.role === role.admin || user.role === role.manager) {
        // Emergency creation
        const newEmployee = await this.prisma.employee.create({
          data: {
            user_id: user.id,
            first_name: user.wp_name.split(' ')[0],
            last_name: user.wp_name.split(' ').slice(1).join(' '),
            email: user.wp_email,
            alias: user.wp_name.toUpperCase(),
            partner_id: user.partner_id || user.id,
            status: 'active',
          },
        });
        employeeId = newEmployee.id;

        await this.prisma.employee_turnover.create({
          data: {
            employee_id: newEmployee.id,
            date: new Date(),
            type: 'hiring',
            reason: 'Alta automática desde TaskTracker (Fallback)',
          }
        });
      }
    }

    if (!employeeId) {
      throw new HttpException('Perfil de empleado no encontrado. Por favor, cierra sesión y vuelve a entrar.', HttpStatus.NOT_FOUND);
    }

    return employeeId;
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
}
