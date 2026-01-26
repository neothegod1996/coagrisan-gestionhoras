import { IsArray, IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { schedule_day, shift_type } from "@prisma/client";

export class CreateScheduleDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    @IsUUID()
    partner_id?: string;

    @IsOptional()
    @IsArray()
    days?: schedule_day[];

    @IsOptional()
    @IsArray()
    sessions?: ScheduleSessionDto[];
}


export class ScheduleSessionDto {
    @IsNotEmpty()
    @IsDate()
    start_time: Date;

    @IsNotEmpty()
    @IsDate()
    end_time: Date;

    @IsNotEmpty()
    @IsEnum(shift_type)
    shift_type: shift_type;

    @IsOptional()
    @IsBoolean()
    has_break: boolean;

    @IsOptional()
    @IsDate()
    break_start_time?: Date;

    @IsOptional()
    @IsDate()
    break_end_time?: Date;
}   