import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, Put, Query } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { role } from '@prisma/client';
import { Response } from 'express';
import { RequestWithUser } from 'src/types';
import { PaginationProfileDto } from './dto/pagination-profile.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) { }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Body() createProfileDto: CreateProfileDto, @Res() res: Response, @Req() req: RequestWithUser) {
    const profile = await this.profilesService.create(createProfileDto, req.user);
    return res.status(201).json({
      success: true,
      data: profile,
      message: 'Profile created successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll(@Res() res: Response, @Req() req: RequestWithUser, @Query() query: PaginationProfileDto) {
    const profiles = await this.profilesService.findAll(query, req.user);
    return res.status(200).json({
      ...profiles,
      success: true,
      message: 'Profiles obtained successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser) {
    const profile = await this.profilesService.findOne(id, req.user);
    return res.status(200).json({
      success: true,
      data: profile,
      message: 'Profile obtained successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto, @Res() res: Response, @Req() req: RequestWithUser) {
    const profile = await this.profilesService.update(id, updateProfileDto, req.user);
    return res.status(200).json({
      success: true,
      data: profile,
      message: 'Profile updated successfully',
    });
  }

  @Roles(role.admin, role.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response, @Req() req: RequestWithUser) {
    await this.profilesService.remove(id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Profile deleted successfully',
    });
  }
}
