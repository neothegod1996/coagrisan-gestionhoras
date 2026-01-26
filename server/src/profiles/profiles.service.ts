import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from 'src/prisma.service';
import { User } from 'src/types';
import { PaginationProfileDto } from './dto/pagination-profile.dto';
import { role } from '@prisma/client';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateProfileDto, user: User) {
    const { partner_id: partner_id_body, ...data } = body;
    if(user.role === role.admin && !partner_id_body) {
      throw new HttpException('"partner_id" field is required', HttpStatus.BAD_REQUEST);
    }
    const partner_id = user.role === role.admin ? partner_id_body : user.partner_id;

    return this.prisma.profile.create({
      data: {
        ...data,
        partner_id: partner_id!,
      },
    });
  }

  async findAll(query: PaginationProfileDto, user: User) {
    const { page, limit, status, search, partner_id: partner_id_query } = query;

    const partner_id = user.role === role.admin ? partner_id_query : user.partner_id;
    const skip = (page - 1) * limit;

    let where: any = {};
    if(partner_id) where.partner_id = partner_id;
    if(status) where.status = status;
    if(search) where.OR = [
      { name: { contains: search } },
    ];
    const [profiles, count] = await this.prisma.$transaction([
      this.prisma.profile.findMany({
        where,
        select: { id: true, name: true, status: true },
        skip,
        take: limit,
      }),
      this.prisma.profile.count({
        where,
      }),
    ]);
    return {
      data: profiles,
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
    const profile = await this.prisma.profile.findUnique({
      where,
      select: { id: true, name: true, status: true },
    });
    if(!profile) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }
    return profile;
  }

  async update(id: string, body: UpdateProfileDto, user: User) {
    const partner_id = user.partner_id;
    
    const where: any = {
      id,
    };
    if(partner_id) where.partner_id = partner_id;
    const findProfile = await this.prisma.profile.findUnique({
      where,
      select: { id: true }
    });
    if(!findProfile) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }
    const profile = await this.prisma.profile.update({
      where,
      data: body,
      select: { id: true, name: true, status: true },
    });
    return profile;
  }

  async remove(id: string, user: User) {
    const partner_id = user.partner_id;
    const where: any = {
      id,
    };
    if(partner_id) where.partner_id = partner_id;

    const findProfile = await this.prisma.profile.findUnique({
      where,
      select: { id: true }
    });
    if(!findProfile) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.profile.delete({ where });
  }
}
