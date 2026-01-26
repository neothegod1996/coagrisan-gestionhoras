import { Module } from '@nestjs/common';
import { IncidencesService } from './incidences.service';
import { IncidencesController } from './incidences.controller';
import { PrismaService } from 'src/prisma.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [IncidencesController],
  providers: [IncidencesService, PrismaService, RolesGuard],
})
export class IncidencesModule {}
