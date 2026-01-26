import { Controller, Get, Post, Body, Param, Delete, UseGuards, Res, Req, Query, Put } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { role } from '@prisma/client';
import { Response } from 'express';
import { RequestWithUser } from 'src/types';
import { AssignScheduleDto } from './dto/assign-schedule.dto';
import { PaginationScheduleDto } from './dto/pagination-schedule.dto';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Res() res: Response, @Req() req: RequestWithUser, @Body() body: CreateScheduleDto) {
    const schedule = await this.schedulesService.create(body, req.user);
    return res.status(201).json({
      success: true,
      data: schedule,
      message: 'Schedule created successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll(@Res() res: Response, @Req() req: RequestWithUser, @Query() query: PaginationScheduleDto) {
    const schedules = await this.schedulesService.findAll(query, req.user);
    return res.status(200).json({
      ...schedules,
      success: true,
      message: 'Schedules obtained successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser) {
    const schedule = await this.schedulesService.findOne(id, req.user);
    return res.status(200).json({
      success: true,
      data: schedule,
      message: 'Schedule obtained successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto, @Res() res: Response, @Req() req: RequestWithUser) {
    const schedule = await this.schedulesService.update(id, updateScheduleDto, req.user);
    return res.status(200).json({
      success: true,
      data: schedule,
      message: 'Schedule updated successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser) {
    await this.schedulesService.remove(id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/assign')
  async assign(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser, @Body() body: AssignScheduleDto) {
    await this.schedulesService.assign(req.user, id, body);
    return res.status(200).json({
      success: true,
      message: 'Schedule assigned successfully',
    });
  }
}
