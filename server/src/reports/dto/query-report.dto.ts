import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsDateString, IsOptional, IsString } from "class-validator";

export class QueryReportDto {
  @IsOptional()
  @IsString()
  employee_id?: string;

  @IsOptional()
  @IsString()
  profile_id?: string;

  @IsOptional()
  @IsString()
  location_id?: string;

  @IsOptional()
  @IsString()
  agreement_id?: string;

  @IsOptional()
  @IsString()
  employee_from?: string;

  @IsOptional()
  @IsString()
  employee_to?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  partner_id?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  limit_to_8_hours?: boolean = false;

  @IsOptional()
  @IsIn(['normal_extra', 'times_costs', 'incidences'])
  report_type?: 'normal_extra' | 'times_costs' | 'incidences' = 'normal_extra';

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  breakdown_type?: 'daily' | 'weekly' | 'monthly' = 'weekly';

  @IsOptional()
  @IsIn(['none', '15', '30', '60'])
  rounding?: 'none' | '15' | '30' | '60' = 'none';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  totalize_weekly?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  totalize_monthly?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  totalize_by_employee?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  totalize_by_report?: boolean = false;
}
