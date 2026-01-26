import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { QueryEmployeeShiftClockDto } from './dto/query-employee-shift-clock.dto';
import { User } from 'src/types';
import { PrismaService } from 'src/prisma.service';
import * as dayjs from 'dayjs';
import { employee_shift_clock_status, role } from '@prisma/client';

@Injectable()
export class EmployeeShiftClockService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(user: User, query: QueryEmployeeShiftClockDto) {
    const employee_id = user.employee?.id;
    const partner_id = user.role === role.admin ? query.partner_id : user.partner_id;
    const isEmployee = user.role === role.employee;
    const { page, limit, employee_id: employee_id_query, date, status } = query;
    const skip = (page - 1) * limit;
    const where: any = {
      employee_shift: {},
      terminal: {}
    };
    if (isEmployee) {
      where.employee_shift.employee_id = employee_id
      where.status = employee_shift_clock_status.approved;
    };
    if (employee_id_query && !isEmployee) where.employee_shift.employee_id = employee_id_query;
    if (date) where.employee_shift.date = { gte: dayjs(date).startOf('day').toDate(), lte: dayjs(date).endOf('day').toDate() };
    if (status && !isEmployee) where.status = status;
    if (partner_id) where.terminal.partner_id = partner_id;
    const [shiftClock, total] = await this.prisma.$transaction([
      this.prisma.employee_shift_clock.findMany({
        where,
        select: {
          id: true,
          time: true,
          status: true,
          terminal: {
            select: {
              id: true,
              name: true,
            }
          },
          employee_shift: {
            select: {
              employee: {
                select: {
                  card_id: true,
                  first_name: true,
                  last_name: true,
                }
              }
            }
          }
        },
        skip,
        take: limit,
      }),
      this.prisma.employee_shift_clock.count({
        where,
      }),
    ]);
    return {
      data: shiftClock,
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
}