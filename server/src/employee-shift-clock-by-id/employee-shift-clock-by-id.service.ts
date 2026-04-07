import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { QueryEmployeeShiftClockDto } from './dto/query-employee-shift-clock.dto';
import { User } from 'src/types';
import { PrismaService } from 'src/prisma.service';
import * as dayjs from 'dayjs';
import { employee_shift_clock, employee_shift_clock_status, role, task_tracker_status } from '@prisma/client';

@Injectable()
export class EmployeeShiftClockServiceById {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(user: User, query: QueryEmployeeShiftClockDto) {
    const partner_id = user.role === role.admin ? query.partner_id : user.partner_id;
    const isEmployee = user.role === role.employee;
    const { page, limit, employee_id: employee_id_query, date, status } = query;
    const skip = (page - 1) * limit;

    const taskTrackerWhere: any = {};

    if (isEmployee) {
      taskTrackerWhere.employee_id = user.employee?.id;
    } else {
      if (employee_id_query) taskTrackerWhere.employee_id = employee_id_query;
      /*if (partner_id) {
        taskTrackerWhere.employee = {
          user: { partner_id }
        };
      }*/
    }

    if (date) {
      taskTrackerWhere.created_at = {
        gte: dayjs(date).startOf('day').toDate(),
        lte: dayjs(date).endOf('day').toDate(),
      };
    }
    const [taskTrackers, total] = await this.prisma.$transaction([
      this.prisma.task_tracker.findMany({
        where: taskTrackerWhere,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          start_time: true,
          end_time: true,
          created_at: true,
          updated_at: true,
          employee: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              card_id: true,
            }
          }
        }
      }),
      this.prisma.task_tracker.count({ where: taskTrackerWhere }),
    ]);

    const taskTrackerIds = taskTrackers.map(t => t.id);

    const employeeShifts = await this.prisma.employee_shift.findMany({
      where: {
        employee_id: {
          in: taskTrackers.map(t => t.employee.id)
        }
      },
      select: {
        id: true,
        employee_id: true,
        date: true
      }
    });

    const shiftIds = employeeShifts.map(s => s.id);

    const shiftClocks = await this.prisma.employee_shift_clock.findMany({
      where: {
        employee_shift_id: { in: shiftIds },
        OR: [
          { session_id: { in: taskTrackerIds } },
          { session_id: 'default' }
        ],
        employee_shift: {
          employee_id: isEmployee
            ? user.employee?.id
            : employee_id_query || undefined,
          ...(date && {
            date: {
              gte: dayjs(date).startOf('day').toDate(),
              lte: dayjs(date).endOf('day').toDate(),
            }
          })
        }
      },
      select: {
        id: true,
        time: true,
        status: true,
        session_id: true,
        employee_shift_id: true,
        created_at: true,
        updated_at: true,
        terminal: {
          select: { id: true, name: true }
        }
      },
      orderBy: { time: 'asc' }
    });

    const data = taskTrackers.map((tracker) => {

      // Buscar shift correspondiente por fecha
      const shift = employeeShifts.find(s =>
        s.employee_id === tracker.employee.id &&
        dayjs(s.date).isSame(tracker.created_at, 'day')
      );

      if (!shift) {
        return {
          task_tracker_id: tracker.id,
          name: tracker.name,
          status: tracker.status,
          employee: tracker.employee,
          start: null,
          end: null
        };
      }

      const clocks = shiftClocks.filter(clock =>
        clock.employee_shift_id === shift.id
      );
      const isNear = (a: Date, b: Date, seconds = 0) =>
        Math.abs(dayjs(a).diff(dayjs(b), 'second')) <= seconds;

      // Match start por created_at
      const start = clocks.find(clock =>
        isNear(clock.created_at, tracker.created_at)
      ) || null;

      // Match end por updated_at
      const end = clocks.find(clock =>
        isNear(clock.created_at, tracker.updated_at)
      ) || null;

      return {
        task_tracker_id: tracker.id,
        name: tracker.name,
        status: tracker.status,
        employee: tracker.employee,
        start,
        end,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async approve(user: User, id: string) {
    const shiftClock = await this.prisma.employee_shift_clock.findUnique({
      where: { id },
    });
    if (!shiftClock) {
      throw new HttpException('Employee shift clock not found', HttpStatus.NOT_FOUND);
    }
    if (shiftClock.status === employee_shift_clock_status.approved) {
      throw new HttpException('Employee shift clock already approved', HttpStatus.BAD_REQUEST);
    }
    await this.prisma.employee_shift_clock.update({
      where: { id },
      data: {
        status: employee_shift_clock_status.approved,
      },
    });
  }

  async update(
    user: User,
    taskTrackerId: string,
    body: {
      start_time?: string;
      end_time?: string;
      status?: employee_shift_clock_status;
    },
    startId?: string,
    endId?: string,
  ) {

    if (!taskTrackerId) {
      throw new HttpException(
        'Task tracker id is required',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!startId) {
      const created = await this.create(user, taskTrackerId);
      startId = created.id;
    }

    const start = await this.prisma.employee_shift_clock.findUnique({
      where: { id: startId },
    });

    if (!start) {
      throw new HttpException(
        'Start shift clock not found',
        HttpStatus.NOT_FOUND
      );
    }

    let end: typeof start | null = null;

    if (endId) {
      end = await this.prisma.employee_shift_clock.findUnique({
        where: { id: endId },
      });

      if (!end) {
        throw new HttpException(
          'End shift clock not found',
          HttpStatus.NOT_FOUND
        );
      }
    }

    const { session_id: rawSessionId } = start;

    let session_id: string;

    if (typeof rawSessionId === 'string' && rawSessionId !== 'default') {
      session_id = rawSessionId;
    } else {
      session_id = taskTrackerId;
    }

    // 🔹 Validación opcional: end > start
    if (body.start_time && body.end_time) {
      if (new Date(body.end_time) <= new Date(body.start_time)) {
        throw new HttpException(
          'End time must be greater than start time',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    let taskTrackerStatus: task_tracker_status | undefined = undefined;

    if (body.status) {
      if (body.status === employee_shift_clock_status.approved && body.end_time) {
        taskTrackerStatus = task_tracker_status.completed;
      } else if (body.status === employee_shift_clock_status.pending) {
        taskTrackerStatus = task_tracker_status.running;
      } else {
        taskTrackerStatus = 'running';
      }
    }

    await this.prisma.task_tracker.update({
      where: { id: taskTrackerId },
      data: {
        ...(body.start_time && { start_time: new Date(body.start_time) }),
        ...(body.end_time && { end_time: new Date(body.end_time) }),
        ...(body.status && { status: taskTrackerStatus }),
      },
    });

    return this.prisma.$transaction(async (tx) => {

      const taskTracker = await tx.task_tracker.findUnique({
        where: { id: taskTrackerId },
      });

      const updatedStart = await tx.employee_shift_clock.update({
        where: { id: startId },
        data: {
          session_id,
          ...(body.start_time && { time: new Date(body.start_time) }),
          ...(body.status && { status: body.status }),
          created_at: taskTracker?.created_at ? taskTracker.created_at : start.created_at,
        },
      });

      let updatedEnd: employee_shift_clock | null = null;

      if (body.end_time && !end) {
        updatedEnd = await tx.employee_shift_clock.create({
          data: {
            employee_shift_id: start.employee_shift_id,
            terminal_id: start.terminal_id,
            session_id,
            time: new Date(body.end_time),
            status: body.status ?? start.status,
          },
        });
      } else if (end && body.end_time) {
        updatedEnd = await tx.employee_shift_clock.update({
          where: { id: endId! },
          data: {
            session_id,
            ...(body.end_time && { time: new Date(body.end_time) }),
            ...(body.status && { status: body.status }),
          },
        });
      }

      return {
        session_id,
        start: updatedStart,
        end: updatedEnd,
      };
    });
  }

  async remove(taskTrackerId: string, startId: string, endId?: string) {
    if (!taskTrackerId) {
      throw new HttpException(
        'Task tracker id is required',
        HttpStatus.BAD_REQUEST
      );
    }

    await this.prisma.task_tracker.delete({
      where: { id: taskTrackerId },
    });

    if (!startId) {
      throw new HttpException(
        'Start shift clock id is required',
        HttpStatus.BAD_REQUEST
      );
    }

    const start = await this.prisma.employee_shift_clock.findUnique({
      where: { id: startId },
    });

    if (!start) {
      throw new HttpException(
        'Start shift clock not found',
        HttpStatus.NOT_FOUND
      );
    }

    let idsToDelete: string[] = [startId];

    if (endId) {
      const end = await this.prisma.employee_shift_clock.findUnique({
        where: { id: endId },
      });

      if (!end) {
        throw new HttpException(
          'End shift clock not found',
          HttpStatus.NOT_FOUND
        );
      }

      idsToDelete.push(endId);
    }

    await this.prisma.employee_shift_clock.deleteMany({
      where: {
        id: { in: idsToDelete },
      },
    });

    return {
      deleted: idsToDelete,
    };
  }

  async create(user: User, taskTrackerId: string) {
    if (!taskTrackerId) {
      throw new HttpException(
        'Task tracker id is required',
        HttpStatus.BAD_REQUEST
      );
    }

    const taskTracker = await this.prisma.task_tracker.findUnique({
      where: { id: taskTrackerId },
    });

    if (!taskTracker) {
      throw new HttpException(
        'Task tracker not found',
        HttpStatus.NOT_FOUND
      );
    }

    if (!taskTracker.start_time) {
      throw new HttpException(
        'Task tracker start time is required to create shift clock',
        HttpStatus.BAD_REQUEST
      );
    }

    const startTime = new Date(taskTracker.start_time);

    return this.prisma.$transaction(async (tx) => {

      // 🔹 Buscar shift del día
      let employeeShift = await tx.employee_shift.findFirst({
        where: {
          employee_id: taskTracker.employee_id,
          date: {
            gte: dayjs(startTime).startOf('day').toDate(),
            lte: dayjs(startTime).endOf('day').toDate(),
          },
        },
      });

      // 🔹 Si no existe, crearlo
      if (!employeeShift) {
        employeeShift = await tx.employee_shift.create({
          data: {
            employee_id: taskTracker.employee_id,
            date: startTime,
          },
        });
      }

      // 🔹 Buscar terminal del partner del empleado
      const employee = await tx.employee.findUnique({
        where: { id: taskTracker.employee_id },
      });

      if (!employee) {
        throw new HttpException(
          'Employee not found',
          HttpStatus.NOT_FOUND
        );
      }

      let terminal = await tx.terminal.findFirst({
        where: { partner_id: employee.partner_id },
        orderBy: { created_at: 'asc' },
      });

      if (!terminal) {
        terminal = await tx.terminal.findFirst({
          orderBy: { created_at: 'asc' },
        });
      }

      if (!terminal) {
        throw new HttpException(
          'Terminal not found',
          HttpStatus.BAD_REQUEST
        );
      }

      // 🔹 Crear shift clock
      const shiftClock = await tx.employee_shift_clock.create({
        data: {
          employee_shift_id: employeeShift.id,
          terminal_id: terminal.id,
          session_id: taskTracker.id,
          time: startTime,
          status: employee_shift_clock_status.pending,
        },
      });

      return shiftClock;
    });
  }
}