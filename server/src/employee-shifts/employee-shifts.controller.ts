import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Query } from '@nestjs/common';
import { EmployeeShiftsService } from './employee-shifts.service';
import { CreateEmployeeShiftDto } from './dto/create-employee-shift.dto';
import { UpdateEmployeeShiftDto } from './dto/update-employee-shift.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { role } from '@prisma/client';
import { Response } from 'express';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import * as dayjs from 'dayjs';

@Controller('employee-shifts')
export class EmployeeShiftsController {
  constructor(private readonly employeeShiftsService: EmployeeShiftsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin)
  @Post()
  async create(@Res() res: Response) {
    const data: CreateEmployeeShiftDto = {
      date: dayjs().toDate(),
      employee_id: '',
      schedule_session_id: '2ad71be5-d871-4c71-9db0-11c2e5b00c10',
    }
    const shift = await this.employeeShiftsService.create(data);
    return res.status(201).json({
      success: true,
      data: shift,
      message: 'Employee shift created successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin)
  @Get()
  async findAll(@Res() res: Response, @Query() query: PaginationDto) {
    const shifts = await this.employeeShiftsService.findAll(query);
    return res.status(200).json({
      ...shifts,
      success: true,
      message: 'Employee shifts fetched successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const shift = await this.employeeShiftsService.findOne(id);
    return res.status(200).json({
      success: true,
      data: shift,
      message: 'Employee shift fetched successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateEmployeeShiftDto: UpdateEmployeeShiftDto, @Res() res: Response) {
    const shift = await this.employeeShiftsService.update(id, updateEmployeeShiftDto);
    return res.status(200).json({
      success: true,
      data: shift,
      message: 'Employee shift updated successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.employeeShiftsService.remove(id);
    return res.status(200).json({
      success: true,
      message: 'Employee shift deleted successfully',
    });
  }
}
