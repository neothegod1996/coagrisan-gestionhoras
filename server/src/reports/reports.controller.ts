import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { QueryReportDto } from './dto/query-report.dto';
import { Response } from 'express';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { role } from '@prisma/client';
import { RequestWithUser } from 'src/types';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Get()
  async findAll(@Res() res: Response, @Query() query: QueryReportDto, @Req() req: RequestWithUser) {
    const reports = await this.reportsService.findAll(query, req.user.partner_id);
    return res.status(200).json({
      data: reports,
      success: true,
      message: 'Reports obtained successfully',
    });
  }
}
