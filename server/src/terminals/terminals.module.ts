import { Module } from '@nestjs/common';
import { TerminalsService } from './terminals.service';
import { TerminalsController } from './terminals.controller';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [TerminalsController],
  providers: [TerminalsService, PrismaService, RolesGuard],
})
export class TerminalsModule {}
