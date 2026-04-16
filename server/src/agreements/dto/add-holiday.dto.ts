import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddHolidayDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  description?: string;
}
