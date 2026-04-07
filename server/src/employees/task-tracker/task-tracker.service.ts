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

  async create(body: CreateTaskTrackerDto, user: User) {

    if (!user.employee?.id) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }

    const partner_id = user.partner_id;


    const startTime = body.start_time ? new Date(body.start_time) : new Date();

    const employee = await this.prisma.employee.findFirst({
      where: {
        id: user.employee.id,
        // partner_id,
      },
      include: { schedule: true },
    });

    if (!employee) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }

    const employeePartnerId = employee.partner_id;

    const scheduleSession = employee.schedule_id
      ? await this.getClosestScheduleSession(employee.schedule_id, startTime)
      : null;

    return this.prisma.$transaction(async (tx) => {
      const taskTracker = await tx.task_tracker.create({
        data: {
          ...body,
          start_time: startTime,
          employee_id: employee.id,
        },
      });

      let employeeShift = await tx.employee_shift.findFirst({
        where: {
          employee_id: employee.id,
          date: {
            gte: dayjs(startTime).startOf('day').toDate(),
            lte: dayjs(startTime).endOf('day').toDate(),
          },
        },
      });

      if (!employeeShift) {
        employeeShift = await tx.employee_shift.create({
          data: {
            employee_id: employee.id,
            date: startTime,
            schedule_session_id: scheduleSession?.id,
          },
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
          time: startTime,
          status: 'pending',
          session_id: taskTracker.id,
        },
      });

      return taskTracker;
    });
  }

  async findAll(query: PaginationTaskTrackerDto, user: User) {
    const employee_id = user.employee!.id;

    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    let where: any = {};
    if (status) where.status = status;
    if (employee_id) where.employee_id = employee_id;
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
    if(!user.employee?.id) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }

    const taskTracker = await this.prisma.task_tracker.findFirst({
      where: {
        id,
        employee_id: user.employee.id,
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
      },
    });

    if (!taskTracker) {
      throw new HttpException('Task tracker not found', HttpStatus.NOT_FOUND);
    }

    return taskTracker;
  }

  async update(id: string, body: UpdateTaskTrackerDto, user: User) {
    if (!user.employee?.id) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }

    const employeeId = user.employee.id;

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
        const newStartTime = new Date(body.start_time);
        if (task.start_time && !dayjs(newStartTime).isSame(dayjs(task.start_time))) {
          startHasChanged = true;
        }
        updateData.start_time = newStartTime;
      }

      if (body.end_time) {
        const taskEndTime = new Date(body.end_time);
        if (task.end_time && !dayjs(taskEndTime).isSame(dayjs(task.end_time))) {
          endHasChanged = true;
        }
        updateData.end_time = taskEndTime;
      }

      // Recalculate duration if we have both values
      const currentStart = updateData.start_time || task.start_time;
      const currentEnd = updateData.end_time || task.end_time;
      
      if (currentStart && currentEnd) {
        updateData.duration = dayjs(currentEnd).diff(dayjs(currentStart), 'seconds');
      }

      const taskTracker = await tx.task_tracker.update({
        where: { id },
        data: updateData,
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

      let terminal = await tx.terminal.findFirst({
        where: { partner_id: user.partner_id },
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
    if(!user.employee?.id) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }

    const taskTracker = await this.prisma.task_tracker.findFirst({
      where: {
        id,
        employee_id: user.employee.id,
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

}