import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { QueryEmployeeShiftClockDto } from './dto/query-employee-shift-clock.dto';
import { User } from 'src/types';
import { PrismaService } from 'src/prisma.service';
import * as dayjs from 'dayjs';
import { employee_shift_clock, employee_shift_clock_status, role, user_type, task_tracker_status } from '@prisma/client';

@Injectable()
export class EmployeeShiftClockService {
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
      if (employee_id_query) {
        taskTrackerWhere.employee_id = employee_id_query;
      } else {
        // Consultamos el partner_id fresco desde la DB
        const userDb = await this.prisma.user.findUnique({
          where: { id: user.id },
          select: { partner_id: true }
        });

        if (userDb?.partner_id) {
          // Buscamos los users que tengan ese partner_id
          const partnerUsers = await this.prisma.user.findMany({
            where: {
              partner_id: userDb.partner_id,
              user_type: user_type.user,
              ...(user.role === role.manager && { role: { not: role.admin } })
            },
            select: { id: true }
          });

          const userIds = partnerUsers.map(u => u.id);

          // Buscamos los employees de esos users
          const partnerEmployees = await this.prisma.employee.findMany({
            where: { user_id: { in: userIds } },
            select: { id: true }
          });

          taskTrackerWhere.employee_id = { in: partnerEmployees.map(e => e.id) };
        }
      }
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

    const historyRecords = await this.prisma.task_tracker_history.findMany({
      where: { task_tracker_id: { in: taskTrackerIds } },
      select: { task_tracker_id: true }
    });
    const historySet = new Set(historyRecords.map(h => h.task_tracker_id));

    const data = await Promise.all(taskTrackers.map(async (tracker) => {
      const is_modified = historySet.has(tracker.id);

      // Primero intentamos por session_id (registros nuevos)
      const clocksBySession = shiftClocks.filter(clock => clock.session_id === tracker.id);

      if (clocksBySession.length > 0) {
        const start = clocksBySession[0] || null;
        const end = clocksBySession.length > 1 ? clocksBySession[clocksBySession.length - 1] : null;
        return {
          task_tracker_id: tracker.id,
          name: tracker.name,
          status: tracker.status,
          employee: tracker.employee,
          is_modified,
          start,
          end,
        };
      }

      // Fallback: lógica vieja por tiempo
      const shift = employeeShifts.find(s =>
        s.employee_id === tracker.employee.id &&
        dayjs(s.date).isSame(tracker.start_time, 'day')
      );

      const isNear = (a: Date, b: Date) =>
        Math.abs(dayjs(a).diff(dayjs(b), 'second')) <= 30;

      let start = shift
        ? shiftClocks.find(clock =>
          clock.employee_shift_id === shift.id &&
          isNear(clock.time ?? clock.created_at, tracker.start_time ?? tracker.created_at)
        ) || null
        : null;

      let end = shift
        ? shiftClocks.find(clock =>
          clock.employee_shift_id === shift.id &&
          isNear(clock.time ?? clock.created_at, tracker.end_time ?? tracker.updated_at)
        ) || null
        : null;

      // Si no encontramos start pero el tracker tiene start_time, creamos el clock
      // Si no encontramos start pero el tracker tiene start_time, creamos el clock
      if (!start && tracker.start_time) {
        const created = await this.create(null as any, tracker.id);
        // Buscamos con el select correcto para tener terminal
        start = await this.prisma.employee_shift_clock.findUnique({
          where: { id: created.id },
          select: {
            id: true,
            time: true,
            status: true,
            session_id: true,
            employee_shift_id: true,
            created_at: true,
            updated_at: true,
            terminal: { select: { id: true, name: true } }
          }
        });
      }

      // Si no encontramos end pero el tracker tiene end_time, creamos el clock
      if (!end && tracker.end_time) {
        const existingStart = start || await this.prisma.employee_shift_clock.findFirst({
          where: { session_id: tracker.id },
          orderBy: { time: 'asc' },
          select: {
            id: true,
            time: true,
            status: true,
            session_id: true,
            employee_shift_id: true,
            terminal_id: true,
            created_at: true,
            updated_at: true,
            terminal: { select: { id: true, name: true } }
          }
        });

        if (existingStart && 'terminal_id' in existingStart) {
          const created = await this.prisma.employee_shift_clock.create({
            data: {
              employee_shift_id: existingStart.employee_shift_id,
              terminal_id: (existingStart as any).terminal_id,
              time: new Date(tracker.end_time),
              status: employee_shift_clock_status.pending,
              session_id: tracker.id,
              created_at: new Date(tracker.end_time),
            },
          });
          end = await this.prisma.employee_shift_clock.findUnique({
            where: { id: created.id },
            select: {
              id: true,
              time: true,
              status: true,
              session_id: true,
              employee_shift_id: true,
              created_at: true,
              updated_at: true,
              terminal: { select: { id: true, name: true } }
            }
          });
        }
      }

      return {
        task_tracker_id: tracker.id,
        name: tracker.name,
        status: tracker.status,
        employee: tracker.employee,
        is_modified,
        start,
        end,
      };
    }));

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

    console.log('Updating employee shift clock with data:', {
      taskTrackerId,
      startId,
      endId,
      ...body,
    });

    const start = await this.prisma.employee_shift_clock.findUnique({
      where: { id: startId },
    });

    console.log('Found start shift clock:', start);

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

    console.log('Updating task tracker with data:', {
      taskTrackerId,
      ...body,
    });

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
      console.log('Update data for start shift clock:', {
        session_id,
        ...(body.start_time && { time: new Date(body.start_time) }),
        ...(body.status && { status: body.status }),
      });

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

      const startHasChanged = body.start_time && Math.floor(start.time.getTime() / 60000) !== Math.floor(new Date(body.start_time).getTime() / 60000);
      const endHasChanged = body.end_time && (!end || Math.floor(end.time.getTime() / 60000) !== Math.floor(new Date(body.end_time).getTime() / 60000));

      if (startHasChanged || endHasChanged) {
        await tx.task_tracker_history.create({
          data: {
            task_tracker_id: taskTrackerId,
            user_id: user.id
          }
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

  async createNewRecord(user: User, body: {
    employee_id: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'approved';
    notes?: string;
  }) {
    const { employee_id, start_time, end_time, status, notes } = body;
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    const taskStatus = status === 'approved' ? 'completed' : 'running';
    const clockStatus = status === 'approved' ? 'approved' : 'pending';

    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findUnique({
        where: { id: employee_id },
      });

      if (!employee) throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);

      let employeeShift = await tx.employee_shift.findFirst({
        where: {
          employee_id,
          date: {
            gte: dayjs(startTime).startOf('day').toDate(),
            lte: dayjs(startTime).endOf('day').toDate(),
          },
        },
      });

      if (!employeeShift) {
        employeeShift = await tx.employee_shift.create({
          data: {
            employee_id,
            date: dayjs(startTime).startOf('day').toDate(),
          },
        });
      }

      const taskTracker = await tx.task_tracker.create({
        data: {
          employee_id,
          start_time: startTime,
          end_time: endTime,
          status: taskStatus,
          name: "Manual Registry",
          description: notes || "Added by administrator",
          duration: dayjs(endTime).diff(dayjs(startTime), 'seconds'),
          created_at: startTime,
          updated_at: endTime,
        },
      });

      let terminal = await tx.terminal.findFirst({
        where: { partner_id: employee.partner_id },
        orderBy: { created_at: 'asc' },
      });

      if (!terminal) {
        terminal = await tx.terminal.findFirst({
          orderBy: { created_at: 'asc' },
        });
      }

      if (!terminal) throw new HttpException('Terminal not found', HttpStatus.BAD_REQUEST);

      await tx.employee_shift_clock.create({
        data: {
          employee_shift_id: employeeShift.id,
          terminal_id: terminal.id,
          time: startTime,
          status: clockStatus,
          session_id: taskTracker.id,
          created_at: startTime,
        },
      });

      await tx.employee_shift_clock.create({
        data: {
          employee_shift_id: employeeShift.id,
          terminal_id: terminal.id,
          time: endTime,
          status: clockStatus,
          session_id: taskTracker.id,
          created_at: endTime,
        },
      });

      return taskTracker;
    });
  }

  async getHistory(taskTrackerId: string) {
    if (!taskTrackerId) {
      throw new HttpException('Task tracker id is required', HttpStatus.BAD_REQUEST);
    }
    const history = await this.prisma.task_tracker_history.findMany({
      where: { task_tracker_id: taskTrackerId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        task_tracker_id: true,
        user_id: true,
        created_at: true,
      }
    });
    console.log(history);

    const userIds: string[] = Array.from(new Set(history.map(h => h.user_id as string)));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, wp_name: true, wp_email: true }
    });

    console.log(users);

    const usersMap = new Map(users.map(u => [u.id, u]));

    return history.map(h => {
      const { user_id, ...rest } = h;
      return {
        ...rest,
        user: usersMap.get(user_id) || null
      };
    });
  }
}