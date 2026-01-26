import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskTrackerDto } from './create-task-tracker.dto';

export class UpdateTaskTrackerDto extends PartialType(CreateTaskTrackerDto) {}
