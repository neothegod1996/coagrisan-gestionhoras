import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma.service';
import { role } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { };

  async create(body: CreateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { wp_email: body.email }
    })
    if (user) {
      throw new HttpException('El usuario ya existe', HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.prisma.user.create({
      data: {
        wp_email: body.email,
        wp_name: body.name,
        role: body.role,
      },
    });
    return newUser;
  }

  async findAll(query: PaginationDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const [users, count] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: {
          OR: [
            { role: role.admin },
            { role: role.manager },
          ]
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: {
          OR: [
            { role: role.admin },
            { role: role.manager }
          ]
        }
      }),
    ]);
    return {
      data: users,
      total: count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        OR: [
          { role: role.admin },
          { role: role.manager },
        ]
      },
    });
    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async update(id: string, body: UpdateUserDto) {
    const findUser = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: { id: true }
    });
    if (!findUser) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    const user = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        wp_email: body.email,
        wp_name: body.name,
      },
    });
    return user;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: { id: true }
    });
    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }
    await this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
}
