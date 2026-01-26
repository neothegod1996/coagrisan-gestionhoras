import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Req, Put, Res } from '@nestjs/common';
import { IncidencesService } from './incidences.service';
import { CreateIncidenceDto } from './dto/create-incidence.dto';
import { UpdateIncidenceDto } from './dto/update-incidence.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { role } from '@prisma/client';
import { RequestWithUser } from 'src/types';
import { QueryIncidenceDto } from './dto/query-incidence.dto';
import { AssignIncidenceDto } from './dto/assign-incidence.dto';
import { Response } from 'express';

@Controller('incidences')
export class IncidencesController {
  constructor(private readonly incidencesService: IncidencesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Post()
  async create(@Req() req: RequestWithUser, @Body() body: CreateIncidenceDto, @Res() res: Response) {
    const incidence = await this.incidencesService.create(req.user, body);
    return res.status(201).json({
      success: true,
      data: incidence,
      message: 'Incidence created successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Get()
  async findAll(@Query() query: QueryIncidenceDto, @Res() res: Response, @Req() req: RequestWithUser) {
    const incidences = await this.incidencesService.findAll(req.user, query);
    return res.status(200).json({
      ...incidences,
      success: true,
      message: 'Incidences fetched successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser) {
    const incidence = await this.incidencesService.findOne(req.user, id);
    return res.status(200).json({
      success: true,
      data: incidence,
      message: 'Incidence fetched successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateIncidenceDto, @Res() res: Response, @Req() req: RequestWithUser) {
    const incidence = await this.incidencesService.update(req.user, id, body);
    return res.status(200).json({
      success: true,
      data: incidence,
      message: 'Incidence updated successfully',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser) {
    await this.incidencesService.remove(req.user, id);
    return res.status(200).json({
      success: true,
      message: 'Incidence deleted successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/assign')
  async assign(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser, @Body() body: AssignIncidenceDto) {
    await this.incidencesService.assign(req.user, id, body);
    return res.status(200).json({
      success: true,
      message: 'Incidence assigned successfully',
    });
  }
}
