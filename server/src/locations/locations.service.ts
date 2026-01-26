import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { User } from 'src/types';
import { PrismaService } from 'src/prisma.service';
import { PaginationLocationDto } from './dto/pagination-location.dto';
import { role } from '@prisma/client';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateLocationDto, user: User) {
    if(user.role === role.admin && !body.partner_id) {
      throw new HttpException('"partner_id" field is required', HttpStatus.BAD_REQUEST);
    }
    const partner_id = user.role === role.admin ? body.partner_id : user.partner_id;

    const location = await this.prisma.location.create({
      data: {
        ...body,
        partner_id: partner_id!,
      },
    });
    return location;
  }

  async findAll(query: PaginationLocationDto, user: User) {
    const { page, limit, status, search, partner_id: partner_id_query } = query;
    const partner_id = user.role === role.admin ? partner_id_query! : user.partner_id;
    const skip = (page - 1) * limit;

    let where: any = {};
    if(partner_id) where.partner_id = partner_id;
    if(status) where.status = status;
    if (search) where.OR = [
      { name: { contains: search } },
    ];
    const [locations, count] = await this.prisma.$transaction([
      this.prisma.location.findMany({
        where,
        select: {
          id: true,
          name: true,
          status: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.location.count({
        where,
      }),
    ]);
    return {
      data: locations,
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
    if(partner_id) where.partner_id = partner_id;
    const location = await this.prisma.location.findUnique({
      where,
      select: {
        id: true,
        name: true,
        status: true,
      },
    });
    if(!location?.id) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }
    return location;
  }

  async update(id: string, body: UpdateLocationDto, user: User) {
    const { partner_id: partner_id_body, ...data } = body;
    const partner_id = user.partner_id;
    
    const where: any = {
      id,
    }
    if(partner_id) where.partner_id = partner_id;
    const findLocation = await this.prisma.location.findUnique({
      where,
      select: { id: true }
    })
    if(!findLocation?.id) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }

    const location = await this.prisma.location.update({
      where,
      data,
      select: {
        id: true,
        name: true,
        status: true,
      },
    });
    return location;
  }

  async remove(id: string, user: User) {
    const partner_id = user.partner_id;
    const where: any = {
      id,
    }
    if(partner_id) where.partner_id = partner_id;
    const findLocation = await this.prisma.location.findUnique({
      where,
      select: { id: true }
    })
    if(!findLocation?.id) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.location.delete({ where });
  }
}
