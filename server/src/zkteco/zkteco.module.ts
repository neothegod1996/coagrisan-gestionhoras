import { Module } from '@nestjs/common';
import { ZktecoService } from './zkteco.service';
import { ZktecoController } from './zkteco.controller';
import { PrismaService } from '../prisma.service';
import { TaskTrackerService } from '../employees/task-tracker/task-tracker.service';

@Module({
  controllers: [ZktecoController],
  providers: [ZktecoService, PrismaService, TaskTrackerService],
})
export class ZktecoModule {}
