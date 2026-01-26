import { Controller, Get, UseGuards, Query, Res } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { role } from '@prisma/client';
import { PaginationPartnerDto } from './dto/query-partner.dto';
import { Response } from 'express';

@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @UseGuards(JwtAuthGuard)
  @Roles(role.admin)
  @Get()
  async findAll(@Query() query: PaginationPartnerDto, @Res() res: Response) {
    const partners = await this.partnersService.findAll(query);
    return res.status(200).json({
      ...partners,
      success: true,
      message: 'Partners obtained successfully',
    });
  }
}
