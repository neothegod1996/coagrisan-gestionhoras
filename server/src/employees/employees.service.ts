import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PrismaService } from 'src/prisma.service';
import { User } from 'src/types';
import { role, user_type } from '@prisma/client';
import { PaginationEmployeeDto } from './dto/pagination-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) { }

  async create(body: CreateEmployeeDto, user: User) {
    if (user.role === role.admin && !body.partner_id) {
      throw new HttpException('"partner_id" field is required', HttpStatus.BAD_REQUEST);
    }
    const partner_id = user.role === role.admin ? body.partner_id : user.partner_id;
    let [findUser, findEmployee] = await Promise.all([
      this.prisma.user.findUnique({
        where: {
          wp_email: body.email
        }
      }),
      this.prisma.employee.findUnique({
        where: {
          email: body.email,
        }
      })
    ])

    if (findEmployee) {
      throw new HttpException('Employee already exists', HttpStatus.BAD_REQUEST);
    }

    if (!findUser) {
      findUser = await this.prisma.user.create({
        data: {
          wp_email: body.email,
          wp_name: body.first_name,
          role: role.employee,
          partner_id,
        },
      });
    }
    findEmployee = await this.prisma.employee.create({
      data: {
        ...body,
        alias: body.first_name.toUpperCase(),
        partner_id: partner_id!,
        user_id: findUser.id
      },
    })
    return findEmployee;
  }

  async findAll(query: PaginationEmployeeDto, user: User) {
    const { page, limit, location, profile, search } = query;
    const skip = (page - 1) * limit;
    let where: any = {};

    if (user.role === role.employee) {
      where.user_id = user.id;
    } else {
      const userDb = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { partner_id: true }
      });

      if (userDb?.partner_id) {

        if (user.role === role.manager) {
          // Buscamos los users que tengan el mismo partner_id
          const partnerUsers = await this.prisma.user.findMany({
            where: {
              partner_id: userDb.partner_id,
              user_type: user_type.user,
              role: { not: role.admin }
            },
            select: { id: true }
          });
          const userIds = partnerUsers.map(u => u.id);
          where.user_id = { in: userIds };
        } else {
          // Admin
          where.partner_id = userDb.partner_id;
        }
      }
    }


    if (location) where.location_id = location;
    if (profile) where.profile_id = profile;
    if (search) {
      const searchTerms = search.trim().split(/\s+/);
      const searchConditions: any[] = [
        { email: { contains: search } },
        { dni: { contains: search } },
        { first_name: { contains: search } },
        { last_name: { contains: search } }
      ];
      if (searchTerms.length > 1) {
        searchConditions.push({
          AND: [
            { first_name: { contains: searchTerms[0] } },
            { last_name: { contains: searchTerms[1] } }
          ]
        });
      }
      where.AND = [
        ...(where.AND || []),
        { OR: searchConditions },
      ];
    }

    if (where.partner_id) {
      where.user = {
        partner_id: where.partner_id,
        user_type: user_type.user,
        ...(user.role === role.manager && { role: { not: role.admin } })
      };
      delete where.partner_id;
    }

    console.log('Where clause:', where);

    const [employees, count] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          dni: true,
          email: true,
          profile: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
          schedule: { select: { id: true, name: true } },
        }
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: employees,
      total: count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: string, user: User) {
    let where: any = { id };
    if (user.role === role.manager) where.partner_id = user.partner_id;
    const employee = await this.prisma.employee.findUnique({
      where,
      select: {
        id: true,
        alias: true,
        card_id: true,
        first_name: true,
        last_name: true,
        dni: true,
        email: true,
        birth_date: true,
        address: true,
        mobile_number: true,
        phone_number: true,
        postal_code: true,
        province: true,
        population: true,
        is_responsible: true,
        profile: {
          select: {
            id: true,
            name: true
          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        },
        schedule: {
          select: {
            id: true,
            name: true
          }
        },
      }
    });
    if (!employee) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }
    return employee;
  }

  async update(id: string, body: UpdateEmployeeDto, user: User) {
    const { partner_id: _, ...data } = body;
    const partner_id = user.partner_id;
    let where: any = { id };
    if (partner_id) where.partner_id = partner_id;

    const employee = await this.prisma.employee.update({
      where,
      data
    });
    return employee;
  }

  async remove(id: string, user: User) {
    const partner_id = user.partner_id;
    let where: any = { id };
    if (partner_id) where.partner_id = partner_id;

    const employee = await this.prisma.employee.findUnique({
      where,
      select: { id: true }
    });
    if (!employee) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.employee.delete({
      where,
    });
  }
}