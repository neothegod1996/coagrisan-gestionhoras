import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { PrismaService } from 'src/prisma.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService, PrismaService, RolesGuard],
})
export class LocationsModule {}
