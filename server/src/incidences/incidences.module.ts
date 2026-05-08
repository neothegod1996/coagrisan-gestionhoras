import { Module } from '@nestjs/common';
import { IncidencesService } from './incidences.service';
import { IncidencesController } from './incidences.controller';
import { IncidenceCategoriesController } from './incidence-categories.controller';
import { PrismaService } from 'src/prisma.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [IncidencesController, IncidenceCategoriesController],
  providers: [IncidencesService, PrismaService, RolesGuard],
})
export class IncidencesModule {}
