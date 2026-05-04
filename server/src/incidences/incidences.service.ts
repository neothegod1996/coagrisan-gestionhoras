import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateIncidenceDto } from './dto/create-incidence.dto';
import { UpdateIncidenceDto } from './dto/update-incidence.dto';
import { PrismaService } from 'src/prisma.service';
import { User } from 'src/types';
import { role } from '@prisma/client';
import * as dayjs from 'dayjs';
import { QueryIncidenceDto } from './dto/query-incidence.dto';
import { AssignIncidenceDto } from './dto/assign-incidence.dto';

@Injectable()
export class IncidencesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(user: User, body: CreateIncidenceDto) {
    if(user.role === role.admin && !body.partner_id) {
      throw new HttpException('"partner_id" field is required', HttpStatus.BAD_REQUEST);
    }

    // Validate that either end_date or duration_hours is provided
    if (!body.end_date && !body.duration_hours) {
      throw new HttpException(
        'Debes proporcionar end_date o duration_hours',
        HttpStatus.BAD_REQUEST
      );
    }

    if (body.end_date && body.duration_hours) {
      throw new HttpException(
        'No puedes proporcionar end_date y duration_hours al mismo tiempo',
        HttpStatus.BAD_REQUEST
      );
    }

    const partner_id = user.role === role.admin ? body.partner_id : user.partner_id;

    // Force incidence to be for the current employee if role is employee
    if (user.role === role.employee) {
      body.is_global = false;
      body.employee_ids = [user.employee?.id!];
      body.profile_ids = [];
    }

    const { employee_ids, profile_ids, ...data } = body;
    const employees = (body.employee_ids) ? await this.prisma.employee.findMany({
      where: {
        AND: [
          {
            id: {
              in: body.employee_ids,
            },
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
    const profiles = (body.profile_ids) ? await this.prisma.profile.findMany({
      where: {
        AND: [
          {
            id: {
              in: body.profile_ids,
            },
          },
          {
            partner_id,
          }
        ]
      },
    }) : [];

    // Calculate end_date from duration_hours if provided
    const start_date = dayjs(body.start_date).toDate();
    const end_date = body.end_date
      ? dayjs(body.end_date).toDate()
      : dayjs(start_date).add(body.duration_hours!, 'hour').toDate();

    const incidence = await this.prisma.incidence.create({
      data: {
        ...data,
        partner_id: partner_id!,
        start_date,
        end_date,
        employees: {
          connect: employees.map(employee => ({ id: employee.id })),
        },
        profiles: {
          connect: profiles.map(profile => ({ id: profile.id })),
        },
      },
    });
    return incidence;
  }

  async findAll(user: User, query: QueryIncidenceDto) {
    const { page, limit, show, search, employee_id, partner_id: partner_id_query, type } = query;
    const partner_id = user.role === role.admin ? partner_id_query : user.partner_id;
    const where: any = {};
    if(partner_id) where.partner_id = partner_id;
    const conditions: any[] = [];

    if(search) {
      conditions.push({
        OR: [
          { description: { contains: search } },
        ]
      });
    }

    if(query.date) {
      conditions.push(
        { start_date: { lte: dayjs(query.date).endOf('day').toDate() } },
        { end_date: { gte: dayjs(query.date).startOf('day').toDate() } }
      );
    }
    
    if(show === 'upcoming') {
      conditions.push({
        start_date: { gte: dayjs().startOf('day').toDate() }
      });
    }
    
    if (employee_id || user.role === role.employee) {
      const final_employee_id = user.role === role.employee ? user.employee?.id : employee_id;
      
      if (final_employee_id) {
        where.employees = {
          some: { id: final_employee_id }
        };
      }
    }
    
    if(type) {
      where.type = type;
    }
    
    if(conditions.length > 0) {
      where.AND = conditions;
    }
    const skip = (page - 1) * limit;
    const [incidences, count] = await this.prisma.$transaction([
      this.prisma.incidence.findMany({ 
        where, 
        skip, 
        orderBy: {
          start_date: 'asc',
        },
        take: limit,
        select: {
          id: true,
          start_date: true,
          end_date: true,
          duration_hours: true,
          type: true,
          description: true,
          all_day: true,
          paid: true,
          is_global: true,
          employees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            }
          },
          profiles: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              employees: true,
              profiles: true
            }
          }
        }
      }),
      this.prisma.incidence.count({ where }),
    ]);
    return {
      data: incidences.map(incidence => {
        const { _count, ...incidenceData } = incidence;
        return {
          ...incidenceData,
          employees: _count.employees,
          profiles: _count.profiles
        }
      }),
      total: count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
    };
  }

  async findOne(user: User, id: string) {
    const partner_id = user.partner_id;
    const where: any = { id };
    if(partner_id) where.partner_id = partner_id;
    const incidence = await this.prisma.incidence.findUnique({
      where,
      select: {
        id: true,
        start_date: true,
        end_date: true,
        duration_hours: true,
        type: true,
        description: true,
        all_day: true,
        paid: true,
        is_global: true,
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          }
        },
        profiles: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });
    if(!incidence) {
      throw new HttpException('Incidence not found', HttpStatus.NOT_FOUND);
    }
    return incidence;
  }

  async update(user: User, id: string, body: UpdateIncidenceDto) {
    const partner_id = user.partner_id;
    const { employee_ids, profile_ids, ...data } = body;

    // Validate that both end_date and duration_hours are not provided at the same time
    if (body.end_date && body.duration_hours) {
      throw new HttpException(
        'No puedes proporcionar end_date y duration_hours al mismo tiempo',
        HttpStatus.BAD_REQUEST
      );
    }

    const employees_where: any = { AND: [{ id: { in: body.employee_ids } } ] };
    if(partner_id) employees_where.AND.push({ partner_id });
    const employees = (body.employee_ids) ? await this.prisma.employee.findMany({
      where: employees_where,
      select: {
        id: true,
      }
    }) : [];

    const profiles_where: any = { AND: [{ id: { in: body.profile_ids } } ] };
    if(partner_id) profiles_where.AND.push({ partner_id });
    const profiles = (body.profile_ids) ? await this.prisma.profile.findMany({
      where: profiles_where,
      select: {
        id: true,
      }
    }) : [];

    // Calculate end_date from duration_hours if provided
    let start_date = data.start_date ? dayjs(data.start_date).toDate() : undefined;
    let end_date = data.end_date ? dayjs(data.end_date).toDate() : undefined;

    // If duration_hours is provided, we need start_date to calculate end_date
    if (body.duration_hours) {
      if (!start_date) {
        // Get current start_date from database
        const where: any = { id };
        if(partner_id) where.partner_id = partner_id;
        const currentIncidence = await this.prisma.incidence.findUnique({
          where,
          select: { start_date: true },
        });
        if (!currentIncidence) {
          throw new HttpException('Incidence not found', HttpStatus.NOT_FOUND);
        }
        start_date = currentIncidence.start_date;
      }
      end_date = dayjs(start_date).add(body.duration_hours, 'hour').toDate();
    }

    const where: any = { id };
    if(partner_id) where.partner_id = partner_id;
    const incidence = await this.prisma.incidence.update({
      where,
      data: {
        ...data,
        start_date,
        end_date,
        employees: {
          set: employees.map(employee => ({ id: employee.id })),
        },
        profiles: {
          set: profiles.map(profile => ({ id: profile.id })),
        },
      },
    });
    return incidence;
  }

  async remove(user: User, id: string) {
    const partner_id = user.partner_id;
    const where: any = { id };
    if(partner_id) where.partner_id = partner_id;
    await this.prisma.incidence.delete({
      where,
    });
  }

  async assign(user: User, id: string, body: AssignIncidenceDto) {
    const partner_id = user.partner_id;
    const { employee_ids, profile_ids } = body;

    const where: any = { id };
    if(partner_id) where.partner_id = partner_id;
    const findIncidence = await this.prisma.incidence.findUnique({
      where,
    });
    if(!findIncidence) {
      throw new HttpException('Incidence not found', HttpStatus.NOT_FOUND);
    }

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
    
    await this.prisma.incidence.update({
      where: { id },
      data: {
        employees: {
          set: employees.map(employee => ({ id: employee.id })),
        },
      },
    });
  }
  async getSummaryByEmployee(user: User, employeeId: string, startDate?: string, endDate?: string) {
    const partner_id = user.partner_id;
    
    // Security check for role.employee
    if (user.role === role.employee && user.employee?.id !== employeeId) {
      return []; // Or throw an UnauthorizedException
    }

    const where: any = {
      employees: {
        some: { id: employeeId }
      }
    };
    if (partner_id) where.partner_id = partner_id;

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) where.AND.push({ start_date: { gte: dayjs(startDate).startOf('day').toDate() } });
      if (endDate) where.AND.push({ end_date: { lte: dayjs(endDate).endOf('day').toDate() } });
    }

    const incidences = await this.prisma.incidence.findMany({
      where,
      select: {
        type: true,
        duration_hours: true,
        start_date: true,
        end_date: true,
        all_day: true,
      }
    });

    const summary: Record<string, number> = {};

    incidences.forEach((inc) => {
      let hours = inc.duration_hours || 0;
      if (!hours && inc.start_date && inc.end_date) {
        // Calculate hours if duration_hours is not set
        const sessionHours = dayjs(inc.end_date).diff(dayjs(inc.start_date), 'hour', true);
        hours = Math.max(0, sessionHours);
      }
      
      summary[inc.type] = (summary[inc.type] || 0) + hours;
    });

    return Object.entries(summary).map(([type, total_hours]) => ({
      type,
      total_hours: Math.round(total_hours * 100) / 100, // Round to 2 decimal places
    }));
  }
}
