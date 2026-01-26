import { Injectable } from '@nestjs/common';
import { CreateEmployeeShiftDto } from './dto/create-employee-shift.dto';
import { UpdateEmployeeShiftDto } from './dto/update-employee-shift.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PrismaService } from 'src/prisma.service';
import * as dayjs from 'dayjs';

@Injectable()
export class EmployeeShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateEmployeeShiftDto) {
    const date = body?.date ? dayjs(body.date).toISOString() : dayjs().toISOString();
    const shift = await this.prisma.employee_shift.create({
      data: {
        ...body,
        date,
        shift_clock: {
          createMany: {
            data: body.shift_clocks?.map(clock => clock) || [],
          },
        },
      },
      select: {
        id: true,
        date: true,
        shift_clock: {
          select: {
            id: true,
            time: true,
            terminal_id: true,
          },
        }
      },
    });
    return shift;
  }

  async findAll(query: PaginationDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [shifts, total] = await this.prisma.$transaction([
      this.prisma.employee_shift.findMany({
        skip,
        take: limit,
      }),
      this.prisma.employee_shift.count(),
    ]);

    return {
      data: shifts,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return `This action returns a #${id} employeeShift`;
  }

  async update(id: string, body: UpdateEmployeeShiftDto) {
    return `This action updates a #${id} employeeShift`;
  }

  async remove(id: string) {
    return `This action removes a #${id} employeeShift`;
  }
}
