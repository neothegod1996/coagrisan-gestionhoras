import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, Query } from '@nestjs/common';
import { TurnoverService } from './turnover.service';
import { CreateTurnoverDto } from './dto/create-turnover.dto';
import { Roles } from 'src/auth/guards/roles.decorator';
import { role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RequestWithUser } from 'src/types';
import { Response } from 'express';
import { PaginationTurnoverDto } from './dto/pagination-turnover.dto';

@Controller('turnover')
export class TurnoverController {
  constructor(private readonly turnoverService: TurnoverService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Post()
  async create(@Res() res: Response, @Req() req: RequestWithUser, @Body() body: CreateTurnoverDto) {
    const turnover = await this.turnoverService.create(body, req.user);
    return res.status(200).json({
      data: turnover,
      success: true,
      message: 'Employee turnover created successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Get()
  async findAll(@Res() res: Response, @Req() req: RequestWithUser, @Query() query: PaginationTurnoverDto) {
    const turnover = await this.turnoverService.findAll(query, req.user);
    return res.status(200).json({
      ...turnover,
      success: true,
      message: 'Employee turnover obtained successfully',
    });
  }
}
