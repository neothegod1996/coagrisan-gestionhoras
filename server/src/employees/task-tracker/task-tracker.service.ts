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

    return {
      data: taskTrackers,
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

      if (body.end_time) {
        const taskEndTime = new Date(body.end_time);
        updateData.end_time = taskEndTime;
        updateData.duration = task.start_time
          ? dayjs(taskEndTime).diff(dayjs(task.start_time), 'seconds')
          : undefined;
      }

      const taskTracker = await tx.task_tracker.update({
        where: { id },
        data: updateData,
      });

      if (!body.end_time) {
        return taskTracker;
      }

      const taskEndTime = new Date(body.end_time);

      const employeeShift = await tx.employee_shift.findFirst({
        where: {
          employee_id: employeeId,
          date: {
            gte: dayjs(taskEndTime).startOf('day').toDate(),
            lte: dayjs(taskEndTime).endOf('day').toDate(),
          },
        },
      });

      if (!employeeShift) {
        throw new HttpException('Employee shift not found', HttpStatus.BAD_REQUEST);
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
          employee_shift_id: employeeShift.id,
          terminal_id: terminal.id,
          time: taskEndTime,
          status: 'pending',
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