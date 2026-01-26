import { Module } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';
import { PrismaService } from 'src/prisma.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [PartnersController],
  providers: [PartnersService, PrismaService, RolesGuard],
})
export class PartnersModule {}
