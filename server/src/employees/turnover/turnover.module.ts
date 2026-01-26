import { Module } from '@nestjs/common';
import { TurnoverService } from './turnover.service';
import { TurnoverController } from './turnover.controller';
import { PrismaService } from 'src/prisma.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [TurnoverController],
  providers: [TurnoverService, PrismaService, RolesGuard],
})
export class TurnoverModule {}
