import { Controller, Get, Post, Param, UseGuards, Req, Res, Query } from '@nestjs/common';
import { EmployeeShiftClockService } from './employee-shift-clock.service';
import { QueryEmployeeShiftClockDto } from './dto/query-employee-shift-clock.dto';
import { Roles } from 'src/auth/guards/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { role } from '@prisma/client';
import { RequestWithUser } from 'src/types';
import { Response } from 'express';

@Controller('shift-clock')
export class EmployeeShiftClockController {
  constructor(private readonly employeeShiftClockService: EmployeeShiftClockService) {}

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
}
