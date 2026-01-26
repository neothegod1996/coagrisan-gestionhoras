import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PaginationPartnerDto } from './dto/query-partner.dto';
import { role } from '@prisma/client';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: PaginationPartnerDto) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;
    let where: any = {
      role: role.manager,
    };
    if (search) where.OR = [
      { wp_name: { contains: search } },
    ];
    const [partners, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        where,
        select: {
          id: true,
          wp_name: true,
          wp_email: true,
          role: true,
          status: true,
          partner_id: true
        },
      }),
      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      data: partners,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }
}
