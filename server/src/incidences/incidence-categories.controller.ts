import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Put, Res, Query } from '@nestjs/common';
import { IncidencesService } from './incidences.service';
import { CreateIncidenceCategoryDto } from './dto/create-incidence-category.dto';
import { UpdateIncidenceCategoryDto } from './dto/update-incidence-category.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { role } from '@prisma/client';
import { RequestWithUser } from 'src/types';
import { Response } from 'express';

@Controller('incidence-categories')
export class IncidenceCategoriesController {
  constructor(private readonly incidencesService: IncidencesService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Post()
  async create(@Req() req: RequestWithUser, @Body() body: CreateIncidenceCategoryDto, @Res() res: Response) {
    const category = await this.incidencesService.createCategory(req.user, body);
    return res.status(201).json({
      success: true,
      data: category,
      message: 'Categoría de incidencia creada correctamente',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager, role.employee)
  @Get()
  async findAll(@Res() res: Response, @Req() req: RequestWithUser, @Query('partner_id') partner_id?: string) {
    const categories = await this.incidencesService.findAllCategories(req.user, partner_id);
    return res.status(200).json({
      success: true,
      data: categories,
      message: 'Categorías obtenidas correctamente',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser) {
    const category = await this.incidencesService.findOneCategory(req.user, id);
    return res.status(200).json({
      success: true,
      data: category,
      message: 'Categoría obtenida correctamente',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateIncidenceCategoryDto, @Res() res: Response, @Req() req: RequestWithUser, @Query('partner_id') partner_id?: string) {
    const category = await this.incidencesService.updateCategory(req.user, id, body, partner_id);
    return res.status(200).json({
      success: true,
      data: category,
      message: 'Categoría actualizada correctamente',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(role.admin, role.manager)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser, @Query('partner_id') partner_id?: string) {
    await this.incidencesService.removeCategory(req.user, id, partner_id);
    return res.status(200).json({
      success: true,
      message: 'Categoría eliminada correctamente',
    });
  }
}
