import { IsNotEmpty, IsDate, IsUUID, IsOptional, IsArray } from 'class-validator';

export class CreateEmployeeShiftDto {
  @IsOptional()
  @IsDate()
  date?: Date;

  @IsNotEmpty()
  @IsUUID()
  employee_id: string;

  @IsNotEmpty()
  @IsUUID()
  schedule_session_id: string;

  @IsOptional()
  @IsArray()
  shift_clocks?: ShiftClockDto[];
}

export class ShiftClockDto {
  @IsNotEmpty()
  @IsDate()
  time: Date;

  @IsNotEmpty()
  @IsUUID()
  terminal_id: string;
}