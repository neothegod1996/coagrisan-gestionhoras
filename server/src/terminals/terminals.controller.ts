import { Controller, Get, Post, Body, Param, Delete, Res, UseGuards, Query, Put } from '@nestjs/common';
import { TerminalsService } from './terminals.service';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { UpdateTerminalDto } from './dto/update-terminal.dto';
import { Response } from 'express';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { role } from '@prisma/client';
import { Roles } from 'src/auth/guards/roles.decorator';
import { PaginationTerminalsDto } from './dto/pagination-terminals.dto';

@Controller('terminals')
export class TerminalsController {
  constructor(private readonly terminalsService: TerminalsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin)
  @Post()
  async create(@Body() createTerminalDto: CreateTerminalDto, @Res() res: Response) {
    const terminal = await this.terminalsService.create(createTerminalDto);
    return res.status(201).json({
      success: true,
      data: terminal,
      message: 'Terminal created successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin)
  @Get()
  async findAll(@Res() res: Response, @Query() query: PaginationTerminalsDto) {
    const terminals = await this.terminalsService.findAll(query);
    return res.status(200).json({
      ...terminals,
      success: true,
      message: 'Terminals obtained successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const terminal = await this.terminalsService.findOne(id);
    return res.status(200).json({
      success: true,
      data: terminal,
      message: 'Terminal obtained successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTerminalDto: UpdateTerminalDto, @Res() res: Response) {
    const terminal = await this.terminalsService.update(id, updateTerminalDto);
    return res.status(200).json({
      success: true,
      data: terminal,
      message: 'Terminal updated successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.terminalsService.remove(id);
    return res.status(200).json({
      success: true,
      message: 'Terminal deleted successfully',
    });
  }
}
