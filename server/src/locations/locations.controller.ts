import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Res, Query, Put } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Roles } from 'src/auth/guards/roles.decorator';
import { role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RequestWithUser } from 'src/types';
import { Response } from 'express';
import { PaginationLocationDto } from './dto/pagination-location.dto';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Body() createLocationDto: CreateLocationDto, @Req() req: RequestWithUser, @Res() res: Response) {
    const location = await this.locationsService.create(createLocationDto, req.user);
    return res.status(201).json({
      success: true,
      data: location,
      message: 'Location created successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll(@Res() res: Response, @Req() req: RequestWithUser, @Query() query: PaginationLocationDto) {
    const locations = await this.locationsService.findAll(query, req.user);
    return res.status(200).json({
      ...locations,
      success: true,
      message: 'Locations obtained successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser) {
    const location = await this.locationsService.findOne(id, req.user);
    return res.status(200).json({
      success: true,
      data: location,
      message: 'Location obtained successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto, @Res() res: Response, @Req() req: RequestWithUser) {
    const location = await this.locationsService.update(id, updateLocationDto, req.user);
    return res.status(200).json({
      success: true,
      data: location,
      message: 'Location updated successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser) {
    await this.locationsService.remove(id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Location deleted successfully',
    });
  }
}
