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
    const partner_id = user?.partner_id;
    if(!user?.employee?.id) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }

    const where: any = {
      id: user.employee.id,
      // partner_id: undefined,
    };
    if (user.role === role.employee) where.partner_id = partner_id;
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: user.employee.id,
        partner_id: partner_id,
      },
    });

    if (!employee) {
      throw new HttpException('Employee not found or does not belong to this partner', HttpStatus.NOT_FOUND);
    }

    const taskTracker = await this.prisma.task_tracker.create({
      data: {
        ...body,
        start_time: body.start_time ? new Date(body.start_time) : undefined,
        end_time: body.end_time ? new Date(body.end_time) : undefined,
        employee_id: user.employee.id,
      },
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
    });

    return taskTracker;
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

    if(!user.employee?.id) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }

    const existingTaskTracker = await this.prisma.task_tracker.findFirst({
      where: {
        id,
        employee_id: user.employee.id,
      },
    });

    if (!existingTaskTracker) {
      throw new HttpException('Task tracker not found', HttpStatus.NOT_FOUND);
    }

    const updateData: any = { ...body };
    if (body.start_time) updateData.start_time = new Date(body.start_time);
    if (body.end_time) updateData.end_time = new Date(body.end_time);
    if(body.end_time && (body.start_time || existingTaskTracker.start_time)) updateData.duration = dayjs(body.end_time).diff(dayjs(body.start_time || existingTaskTracker.start_time), 'seconds');

    const taskTracker = await this.prisma.task_tracker.update({
      where: { id },
      data: updateData,
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
    });

    return taskTracker;
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
}