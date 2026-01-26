import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { task_tracker_status } from '@prisma/client';

export class CreateTaskTrackerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(task_tracker_status)
  status?: task_tracker_status;

  @IsOptional()
  @IsDateString()
  start_time?: string;

  @IsOptional()
  @IsDateString()
  end_time?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}
