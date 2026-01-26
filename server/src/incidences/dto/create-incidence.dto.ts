import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";
import { incidence_type } from "@prisma/client";

export class CreateIncidenceDto {
    @IsNotEmpty()
    @IsEnum(incidence_type)
    type: incidence_type;

    @IsNotEmpty()
    @IsDateString()
    start_date: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    duration_hours?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    paid?: boolean;

    @IsOptional()
    @IsBoolean()
    all_day?: boolean;

    @IsOptional()
    @IsBoolean()
    is_global?: boolean;

    @IsOptional()
    @IsArray()
    employee_ids?: string[];

    @IsOptional()
    @IsArray()
    profile_ids?: string[];

    @IsOptional()
    @IsString()
    partner_id?: string;
}
