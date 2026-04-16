import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AgreementsService } from './agreements.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';
import { PaginationAgreementDto } from './dto/pagination-agreement.dto';
import { AddHolidayDto } from './dto/add-holiday.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { role } from '@prisma/client';
import { RequestWithUser } from 'src/types';

@Controller('agreements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Roles(role.admin, role.manager)
  @Post()
  create(@Body() createAgreementDto: CreateAgreementDto, @Req() req: RequestWithUser) {
    return this.agreementsService.create(createAgreementDto, req.user);
  }

  @Roles(role.admin, role.manager)
  @Get()
  findAll(@Query() query: PaginationAgreementDto, @Req() req: RequestWithUser) {
    return this.agreementsService.findAll(query, req.user);
  }

  @Roles(role.admin, role.manager)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.agreementsService.findOne(id, req.user);
  }

  @Roles(role.admin, role.manager)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAgreementDto: UpdateAgreementDto,
    @Req() req: RequestWithUser,
  ) {
    return this.agreementsService.update(id, updateAgreementDto, req.user);
  }

  @Roles(role.admin, role.manager)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.agreementsService.remove(id, req.user);
  }

  @Roles(role.admin, role.manager)
  @Post(':id/holidays')
  addHoliday(
    @Param('id') id: string,
    @Body() addHolidayDto: AddHolidayDto,
    @Req() req: RequestWithUser,
  ) {
    return this.agreementsService.addHoliday(id, addHolidayDto, req.user);
  }

  @Roles(role.admin, role.manager)
  @Delete('holidays/:holidayId')
  removeHoliday(@Param('holidayId') holidayId: string, @Req() req: RequestWithUser) {
    return this.agreementsService.removeHoliday(holidayId, req.user);
  }
}
