import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { User } from 'src/types';
import { PrismaService } from 'src/prisma.service';
import { role } from '@prisma/client';
import { PaginationScheduleDto } from './dto/pagination-schedule.dto';
import * as dayjs from 'dayjs';
import { AssignScheduleDto } from './dto/assign-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) { }

  private sortDaysByWeekOrder(days: string[]): string[] {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.sort((a, b) => {
      const indexA = dayOrder.indexOf(a);
      const indexB = dayOrder.indexOf(b);
      return indexA - indexB;
    });
  }

  async create(body: CreateScheduleDto, user: User) {
    const { partner_id: partner_id_body, sessions, days, ...data } = body;

    if(user.role === role.admin && !partner_id_body) {
      throw new HttpException('"partner_id" field is required', HttpStatus.BAD_REQUEST);
    }
    const partner_id = user.role === role.admin ? partner_id_body : user.partner_id;
    
    const schedule = await this.prisma.schedule.create({
      data: {
        ...data,
        partner_id: partner_id!,
        days: {
          createMany: {
            data: days ? days.map(day => ({ day })) : [],
          },
        },
      },
      select: {
        id: true
      }
    });
    if (sessions && sessions.length > 0) {
      await this.prisma.schedule_session.createMany({
        data: sessions.map(session => ({
          ...session,
          start_time: dayjs(session.start_time).toISOString(),
          end_time: dayjs(session.end_time).toISOString(),
          break_start_time: session.break_start_time ? dayjs(session.break_start_time).toISOString() : null,
          break_end_time: session.break_end_time ? dayjs(session.break_end_time).toISOString() : null,
          extend_for_break: session.extend_for_break || false,
          total_time: dayjs(session.end_time).diff(dayjs(session.start_time), 'minutes'),
          schedule_id: schedule.id,
        })),
      })
    }

    const createdSchedule = await this.prisma.schedule.findUnique({
      where: { id: schedule.id },
      select: {
        id: true,
        name: true,
        description: true,
        sessions: {
          select: {
            id: true,
            start_time: true,
            end_time: true,
            total_time: true,
            shift_type: true,
            has_break: true,
            break_start_time: true,
            break_end_time: true,
          }
        },
        days: {
          select: {
            day: true,
          },
        },
      }
    });

    return {
      ...createdSchedule,
      days: this.sortDaysByWeekOrder(createdSchedule?.days?.map(day => day.day) || []),
    };
  }

  async findAll(query: PaginationScheduleDto, user: User) {
    const { page, limit, shift_type, search, partner_id: partner_id_query } = query;
    const partner_id = user.role === role.admin ? partner_id_query : user.partner_id;
    const skip = (page - 1) * limit;

    let where: any = {};
    if (partner_id) where.partner_id = partner_id;
    if (shift_type) where.sessions = {
      some: {
        shift_type: shift_type,
      },
    };
    if (search) where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
    const [schedules, count] = await this.prisma.$transaction([
      this.prisma.schedule.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          partner_id: true,
          sessions: {
            select: {
              id: true,
              start_time: true,
              end_time: true,
              shift_type: true,
              has_break: true,
              break_start_time: true,
              break_end_time: true,
            },
          },
          days: {
            select: {
              day: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.schedule.count({
        where,
      }),
    ]);
    return {
      data: schedules.map(schedule => ({
        ...schedule,
        days: this.sortDaysByWeekOrder(schedule.days.map(day => day.day)),
      })),
      total: count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: string, user: User) {
    const partner_id = user.partner_id;
    let where: any = {
      id,
    };
    if (partner_id) where.partner_id = partner_id;
    const schedule = await this.prisma.schedule.findUnique({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        partner_id: true,
        sessions: {
          select: {
            id: true,
            start_time: true,
            end_time: true,
            shift_type: true,
            has_break: true,
            break_start_time: true,
            break_end_time: true,
          },
        },
        days: {
          select: {
            day: true,
          },
        },
      },
    });
    if (!schedule?.id) {
      throw new HttpException('Schedule not found', HttpStatus.NOT_FOUND);
    }
    return {
      ...schedule,
      days: this.sortDaysByWeekOrder(schedule?.days?.map(day => day.day) || []),
    };
  }

  async update(id: string, body: UpdateScheduleDto, user: User) {
    const partner_id = user.partner_id;
    const { partner_id: _, days, sessions, ...data } = body;
    const where: any = {
      id,
    }
    if (partner_id) where.partner_id = partner_id;
    const findSchedule = await this.prisma.schedule.findUnique({
      where,
      select: { id: true }
    });
    if (!findSchedule?.id) {
      throw new HttpException('Schedule not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.schedule.update({
      where,
      data
    });
    if (sessions && sessions.length > 0) {
      await this.prisma.schedule_session.deleteMany({
        where: { schedule_id: id },
      })
      await this.prisma.schedule_session.createMany({
        data: sessions?.map(session => ({
          ...session,
          start_time: dayjs(session.start_time).toISOString(),
          end_time: dayjs(session.end_time).toISOString(),
          break_start_time: session.break_start_time ? dayjs(session.break_start_time).toISOString() : null,
          break_end_time: session.break_end_time ? dayjs(session.break_end_time).toISOString() : null,
          extend_for_break: session.extend_for_break || false,
          total_time: dayjs(session.end_time).diff(dayjs(session.start_time), 'minutes'),
          schedule_id: id,
        })),
      })
    }
    if (days && days.length > 0) {
      await this.prisma.schedule_days.deleteMany({
        where: { schedule_id: id },
      })
      await this.prisma.schedule_days.createMany({
        data: days.map(day => ({ day, schedule_id: id })),
      })
    }

    const updatedSchedule = await this.prisma.schedule.findUnique({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        sessions: {
          select: {
            id: true,
            start_time: true,
            end_time: true,
            total_time: true,
            shift_type: true,
            has_break: true,
            break_start_time: true,
            break_end_time: true,
          },
        },
        days: {
          select: {
            day: true,
          },
        },
      }
    })

    return {
      ...updatedSchedule,
      days: this.sortDaysByWeekOrder(updatedSchedule?.days?.map(day => day.day) || []),
    };
  }

  async remove(id: string, user: User) {
    const partner_id = user.partner_id;
    const where: any = {
      id,
    }
    if (partner_id) where.partner_id = partner_id;
    const findSchedule = await this.prisma.schedule.findUnique({
      where,
      select: { id: true }
    });
    if (!findSchedule?.id) {
      throw new HttpException('Schedule not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.$transaction([
      this.prisma.schedule_session.deleteMany({ where: { schedule_id: id } }),
      this.prisma.schedule_days.deleteMany({ where: { schedule_id: id } }),
      this.prisma.schedule.delete({ where }),
    ]);
  }

  async assign(user: User, id: string, body: AssignScheduleDto) {
    const partner_id = user.partner_id;
    const { employee_ids, profile_ids } = body;

    const where: any = { id };
    if (partner_id) where.partner_id = partner_id;
    const findSchedule = await this.prisma.schedule.findUnique({
      where,
    });
    if(!findSchedule) {
      throw new HttpException('Schedule not found', HttpStatus.NOT_FOUND);
    }

    const { start_date, end_date } = body;

    const employees = (employee_ids || profile_ids) ? await this.prisma.employee.findMany({
      where: {
        AND: [
          {
            OR: [
              ...(employee_ids ? [{
                id: {
                  in: employee_ids,
                },
              }] : []),
              ...(profile_ids ? [{
                profile_id: {
                  in: profile_ids,
                },
              }] : []),
            ],
          },
          {
            partner_id,
          },
        ],
      },
      select: {
        id: true,
      }
    }) : [];

    if(employees.length === 0) {
      throw new HttpException('Employees not found', HttpStatus.NOT_FOUND);
    }

    if (start_date) {
      // Dynamic assignment (History)
      const dynamicAssignments = employees.map(employee => ({
        employee_id: employee.id,
        schedule_id: id,
        start_date: dayjs(start_date).toDate(),
        end_date: end_date ? dayjs(end_date).toDate() : null,
      }));

      await this.prisma.employee_schedule.createMany({
        data: dynamicAssignments,
      });

      // Update current schedule_id for convenience (legacy support)
      await this.prisma.employee.updateMany({
        where: {
          id: { in: employees.map(e => e.id) },
        },
        data: {
          schedule_id: id,
        },
      });
    } else {
      // Legacy assignment (Simple update)
      await this.prisma.schedule.update({
        where: { id },
        data: {
          employee: {
            set: employees.map(employee => ({ id: employee.id })),
          },
        },
      });
    }
  }
}