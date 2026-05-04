import { IsArray, IsBoolean, IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class EmployeeScheduleDto {
    @IsNotEmpty()
    @IsString()
    schedule_id: string;

    @IsNotEmpty()
    @IsDateString()
    start_date: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;
}

export class CreateEmployeeDto {
    @IsNotEmpty()
    @IsString()
    card_id: string;

    @IsOptional()
    @IsString()
    employee_code?: string;

    @IsString()
    @IsNotEmpty()
    first_name: string;

    @IsNotEmpty()
    @IsString()
    last_name: string;

    @IsNotEmpty()
    @IsString()
    dni: string;

    @IsNotEmpty()
    @IsDateString()
    birth_date: Date;

    @IsNotEmpty()
    @IsString()
    address: string;

    @IsNotEmpty()
    @IsString()
    postal_code: string;

    @IsNotEmpty()
    @IsString()
    province: string;

    @IsNotEmpty()
    @IsString()
    population: string;

    @IsNotEmpty()
    @IsString()
    phone_number: string;

    @IsNotEmpty()
    @IsString()
    mobile_number: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    partner_id?: string;

    @IsNotEmpty()
    @IsString()
    profile_id: string;

    @IsNotEmpty()
    @IsString()
    schedule_id: string;

    @IsNotEmpty()
    @IsString()
    location_id: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EmployeeScheduleDto)
    schedules_history?: EmployeeScheduleDto[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    agreement_ids?: string[];

    @IsOptional()
    @IsBoolean()
    is_responsible?: boolean;

    @IsOptional()
    @IsString()
    status?: 'active' | 'inactive';

    @IsOptional()
    @IsString()
    turnover_date?: string;

    @IsOptional()
    @IsString()
    turnover_reason?: string;

    @IsOptional()
    @IsString()
    turnover_comment?: string;
}
