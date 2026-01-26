import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTurnoverDto } from './dto/create-turnover.dto';
import { PrismaService } from 'src/prisma.service';
import { User } from 'src/types';
import { role, status, turnover_type } from '@prisma/client';
import { PaginationTurnoverDto } from './dto/pagination-turnover.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class TurnoverService {
  constructor(private prisma: PrismaService) {}
  
  async create(body: CreateTurnoverDto, user: User) {
    let where: any = { 
      id: body.employee_id,
    };
    
    const employee = await this.prisma.employee.findUnique({
      where,
    });
    if (!employee) {
      throw new HttpException('El empleado no existe', HttpStatus.NOT_FOUND);
    }
    if(employee.status === status.active && body.type === turnover_type.hiring) {
      throw new HttpException('El empleado ya está dado de alta', HttpStatus.BAD_REQUEST);
    }
    if(employee.status === status.inactive && body.type === turnover_type.departure) {
      throw new HttpException('El empleado ya está dado de baja', HttpStatus.BAD_REQUEST);
    }

    const turnover = await this.prisma.employee_turnover.create({
      data: {
        ...body,
        date: dayjs(body.date).toDate(),
        employee_id: body.employee_id,
      },
      select: {
        id: true,
        date: true,
        type: true,
        employee_id: true,
        employee: { select: { first_name: true, last_name: true } },
      }
    });
    await this.prisma.employee.update({
      where,
      data: {
        status: body.type === turnover_type.departure ? status.inactive : status.active,
      },
    })
    return turnover;
  }

  async findAll(query: PaginationTurnoverDto, user: User) {
    const { page, limit, employee_id, type, search, date } = query;
    const skip = (page - 1) * limit;

    let where: any = {};
    if(employee_id) where.employee_id = employee_id;
    if(type) where.type = type;
    if(date) where.date = { gte: dayjs(date).startOf('day').toDate(), lte: dayjs(date).endOf('day').toDate() };
    if(search) where.employee = {
      OR: [
        { id: { contains: search } },
        { card_id: { contains: search } },
        { dni: { contains: search } },
        { first_name: { contains: search } },
        { last_name: { contains: search } },
      ],
    };

    const [turnovers, count] = await this.prisma.$transaction([
      this.prisma.employee_turnover.findMany({
        where,
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          date: true,
          type: true,
          employee_id: true,
          employee: { select: { first_name: true, last_name: true } },
        },
      }),
      this.prisma.employee_turnover.count({
        where,
      }),
    ]);
    return {
      data: turnovers,
      total: count,
      page: page,
      limit: limit,
      total_pages: Math.ceil(count / limit),
    };
  }
}
