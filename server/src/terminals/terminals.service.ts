import { HttpStatus, HttpException, Injectable } from '@nestjs/common';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { UpdateTerminalDto } from './dto/update-terminal.dto';
import { PrismaService } from 'src/prisma.service';
import { PaginationTerminalsDto } from './dto/pagination-terminals.dto';

@Injectable()
export class TerminalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateTerminalDto) {
    const terminal = await this.prisma.terminal.create({
      data: body
    });
    return terminal;
  }

  async findAll(query: PaginationTerminalsDto) {
    const { page, limit, connection_status, search, partner_id } = query;
    const skip = (page - 1) * limit;

    let where: any = {};
    if(partner_id) where.partner_id = partner_id;
    if(connection_status) where.connection_status = connection_status;
    if(search) where.OR = [
      { id: { contains: search } },
      { name: { contains: search } },
    ];

    const terminals = await this.prisma.terminal.findMany({
      skip,
      take: limit,
      where,
    });
    return {
      data: terminals,
      total: terminals.length,
      page,
      limit,
      total_pages: Math.ceil(terminals.length / limit),
    };
  }

  async findOne(id: string) {
    const terminal = await this.prisma.terminal.findUnique({
      where: { id },
    });
    if(!terminal) {
      throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND);
    }
    return terminal;
  }

  async update(id: string, body: UpdateTerminalDto) {
    const findTerminal = await this.prisma.terminal.findUnique({
      where: { id },
    });
    if (!findTerminal) {
      throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND);
    }

    const terminal = await this.prisma.terminal.update({
      where: { id },
      data: body,
    });
    return terminal;
  }

  async remove(id: string) {
    const terminal = await this.prisma.terminal.findUnique({
      where: { id },
    });
    if(!terminal) {
      throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.terminal.delete({
      where: { id },
    });
  }
}
