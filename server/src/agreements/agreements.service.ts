import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';
import { User } from 'src/types';
import { role } from '@prisma/client';
import { PaginationAgreementDto } from './dto/pagination-agreement.dto';
import { AddHolidayDto } from './dto/add-holiday.dto';

@Injectable()
export class AgreementsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(body: CreateAgreementDto, user: User) {
    const { partner_id: partner_id_body, ...data } = body;
    const partner_id = partner_id_body ?? (user.role === role.admin ? user.id : user.partner_id);
    if (!partner_id) {
      throw new HttpException('"partner_id" field is required', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.agreement.create({
      data: {
        ...data,
        partner_id: partner_id!,
      },
    });
  }

  async findAll(query: PaginationAgreementDto, user: User) {
    const { page, limit, search, partner_id: partner_id_query } = query;

    const partner_id = user.role === role.admin ? user.partner_id : partner_id_query;
    const skip = (page - 1) * limit;


    let where: any = {};
    if (partner_id) where.partner_id = partner_id;
    if (search) {
      where.OR = [{ name: { contains: search } }];
    }

    const [agreements, count] = await this.prisma.$transaction([
      this.prisma.agreement.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { employees: true, holidays: true },
          },
        },
      }),
      this.prisma.agreement.count({
        where,
      }),
    ]);

    return {
      data: agreements,
      total: count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: string, user: User) {
    const where: any = { id };
    if (user.role !== role.admin) where.partner_id = user.partner_id;

    const agreement = await this.prisma.agreement.findUnique({
      where,
      include: {
        holidays: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!agreement) {
      throw new HttpException('Agreement not found', HttpStatus.NOT_FOUND);
    }

    return agreement;
  }

  async update(id: string, body: UpdateAgreementDto, user: User) {
    const where: any = { id };
    if (user.role !== role.admin) where.partner_id = user.partner_id;

    const findAgreement = await this.prisma.agreement.findUnique({ where });
    if (!findAgreement) {
      throw new HttpException('Agreement not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.agreement.update({
      where,
      data: body,
    });
  }

  async remove(id: string, user: User) {
    const where: any = { id };
    if (user.role !== role.admin) where.partner_id = user.partner_id;

    const findAgreement = await this.prisma.agreement.findUnique({ where });
    if (!findAgreement) {
      throw new HttpException('Agreement not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.agreement.delete({ where });
  }

  // Holiday Management
  async addHoliday(agreementId: string, body: AddHolidayDto, user: User) {
    const where: any = { id: agreementId };
    if (user.role !== role.admin) where.partner_id = user.partner_id;

    const agreement = await this.prisma.agreement.findUnique({ where });
    if (!agreement) {
      throw new HttpException('Agreement not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.agreement_holiday.create({
      data: {
        date: new Date(body.date),
        description: body.description,
        agreement_id: agreementId,
      },
    });
  }

  async removeHoliday(holidayId: string, user: User) {
    const holiday = await this.prisma.agreement_holiday.findUnique({
      where: { id: holidayId },
      include: { agreement: true },
    });

    if (!holiday) {
      throw new HttpException('Holiday not found', HttpStatus.NOT_FOUND);
    }

    if (user.role !== role.admin && holiday.agreement.partner_id !== user.partner_id) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    return this.prisma.agreement_holiday.delete({
      where: { id: holidayId },
    });
  }
}
