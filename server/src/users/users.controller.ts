import { Controller, Get, Post, Body, Param, Delete, Res, UseGuards, Query, Put, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { role } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(role.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(
    @Body() body: CreateUserDto,
    @Res() res: Response
  ) {
    const user = await this.usersService.create(body);
    return res.status(201).json({
      success: true,
      data: user,
      message: 'Usuario creado con éxito',
    });
  }

  @Roles(role.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll(
    @Res() res: Response,
    @Query() query: PaginationDto
  ) {
    const users = await this.usersService.findAll(query);
    return res.status(200).json({
      ...users,
      success: true
    });
  }

  @Roles(role.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }
    return res.status(200).json({
      success: true,
      data: user,
    });
  }

  @Roles(role.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: Response
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return res.status(200).json({
      success: true,
      data: user,
    });
  }

  @Roles(role.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    await this.usersService.remove(id);
    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado con éxito',
    });
  }
}
