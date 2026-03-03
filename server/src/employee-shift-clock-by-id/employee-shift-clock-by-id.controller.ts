import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Res, Query } from '@nestjs/common';
import { EmployeeShiftClockServiceById } from './employee-shift-clock-by-id.service';
import { QueryEmployeeShiftClockDto } from './dto/query-employee-shift-clock.dto';
import { Roles } from 'src/auth/guards/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { role } from '@prisma/client';
import { RequestWithUser } from 'src/types';
import { Response } from 'express';

@Controller('shift-clock-by-id')
export class EmployeeShiftClockControllerById {
  constructor(private readonly employeeShiftClockService: EmployeeShiftClockServiceById) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager, role.employee)
  @Get()
  async findAll(@Query() query: QueryEmployeeShiftClockDto, @Req() req: RequestWithUser, @Res() res: Response) {
    const shiftClock = await this.employeeShiftClockService.findAll(req.user, query);
    return res.status(200).json({
      ...shiftClock,
      success: true,
      message: 'Employee shift clock obtained successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Post(':id/approve')
  async approve(@Param('id') id: string, @Req() req: RequestWithUser, @Res() res: Response) {
    await this.employeeShiftClockService.approve(req.user, id);
    return res.status(200).json({
      success: true,
      message: 'Employee shift clock approved successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Put(':taskTrackerId')
  async update(
    @Param('taskTrackerId') taskTrackerId: string,
    @Query('startId') startId: string | undefined,
    @Query('endId') endId: string | undefined,
    @Body() body: { start_time?: string; end_time?: string; status?: string },
    @Req() req: RequestWithUser,
    @Res() res: Response
  ) {
    const result = await this.employeeShiftClockService.update(
      req.user,
      taskTrackerId,
      body as any,
      startId,
      endId
    );

    return res.status(200).json({
      data: result,
      success: true,
      message: 'Employee shift clock updated successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Delete(':startId')
  async remove(
    @Param('startId') startId: string,
    @Query('endId') endId: string | undefined,
    @Query('task_tracker_id') taskTrackerId: string,
    @Res() res: Response
  ) {
    await this.employeeShiftClockService.remove(taskTrackerId, startId, endId);
    return res.status(200).json({
      success: true,
      message: 'Employee shift clock deleted successfully',
    });
  }
}