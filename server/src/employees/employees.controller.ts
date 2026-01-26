import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Res, Query, Put } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { role } from '@prisma/client';
import { RequestWithUser } from 'src/types';
import { Response } from 'express';
import { PaginationEmployeeDto } from './dto/pagination-employee.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Post()
  async create(@Req() req: RequestWithUser, @Res() res: Response, @Body() body: CreateEmployeeDto) {
    const employee = await this.employeesService.create(body, req.user);
    return res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Get()
  async findAll(@Res() res: Response, @Req() req: RequestWithUser, @Query() query: PaginationEmployeeDto) {
    const employees = await this.employeesService.findAll(query, req.user);
    return res.status(200).json({
      ...employees,
      success: true,
      message: 'Employees obtained successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Get(':id')
  async findOne(@Res() res: Response, @Param('id') id: string, @Req() req: RequestWithUser) {
    const employee = await this.employeesService.findOne(id, req.user);
    return res.status(200).json({
      data: employee,
      success: true,
      message: 'Employee obtained successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Put(':id')
  async update(@Res() res: Response, @Param('id') id: string, @Body() body: UpdateEmployeeDto, @Req() req: RequestWithUser) {
    const employee = await this.employeesService.update(id, body, req.user);
    return res.status(200).json({
      data: employee,
      success: true,
      message: 'Employee updated successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string, @Req() req: RequestWithUser) {
    await this.employeesService.remove(id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
    });
  }
}
