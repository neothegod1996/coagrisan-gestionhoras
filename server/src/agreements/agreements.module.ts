import { Module } from '@nestjs/common';
import { AgreementsService } from './agreements.service';
import { AgreementsController } from './agreements.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [AgreementsController],
  providers: [AgreementsService, PrismaService],
  exports: [AgreementsService],
})
export class AgreementsModule {}
