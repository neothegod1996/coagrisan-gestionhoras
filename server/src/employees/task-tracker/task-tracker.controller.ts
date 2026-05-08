import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res, Query, Put } from '@nestjs/common';
import { TaskTrackerService } from './task-tracker.service';
import { CreateTaskTrackerDto } from './dto/create-task-tracker.dto';
import { UpdateTaskTrackerDto } from './dto/update-task-tracker.dto';
import { PaginationTaskTrackerDto } from './dto/pagination-task-tracker.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { role } from '@prisma/client';
import { RequestWithUser } from 'src/types';
import { Response } from 'express';

import { BulkApproveDto } from './dto/bulk-approve.dto';

@Controller('task-tracker')
export class TaskTrackerController {
  constructor(private readonly taskTrackerService: TaskTrackerService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.manager, role.admin)
  @Post('bulk-approve')
  async bulkApprove(@Req() req: RequestWithUser, @Res() res: Response, @Body() body: BulkApproveDto) {
    const result = await this.taskTrackerService.bulkApprove(body, req.user);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Tasks processed successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.employee, role.manager, role.admin)
  @Post()
  async create(@Req() req: RequestWithUser, @Res() res: Response, @Body() body: CreateTaskTrackerDto) {
    const taskTracker = await this.taskTrackerService.create(body, req.user, req.ip);
    return res.status(201).json({
      success: true,
      data: taskTracker,
      message: 'Task tracker created successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.employee, role.manager, role.admin)
  @Get()
  async findAll(@Res() res: Response, @Req() req: RequestWithUser, @Query() query: PaginationTaskTrackerDto) {
    const taskTrackers = await this.taskTrackerService.findAll(query, req.user);
    return res.status(200).json({
      ...taskTrackers,
      success: true,
      message: 'Task trackers obtained successfully',
    });
  }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.employee, role.manager, role.admin)
  @Get(':id')
  async findOne(@Res() res: Response, @Param('id') id: string, @Req() req: RequestWithUser) {
    const taskTracker = await this.taskTrackerService.findOne(id, req.user);
    return res.status(200).json({
      data: taskTracker,
      success: true,
      message: 'Task tracker obtained successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.employee, role.manager, role.admin)
  @Put(':id')
  async update(@Res() res: Response, @Param('id') id: string, @Body() body: UpdateTaskTrackerDto, @Req() req: RequestWithUser) {
    const taskTracker = await this.taskTrackerService.update(id, body, req.user);
    return res.status(200).json({
      data: taskTracker,
      success: true,
      message: 'Task tracker updated successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.employee, role.manager)
  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string, @Req() req: RequestWithUser) {
    await this.taskTrackerService.remove(id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Task tracker deleted successfully',
    });
  }
}
