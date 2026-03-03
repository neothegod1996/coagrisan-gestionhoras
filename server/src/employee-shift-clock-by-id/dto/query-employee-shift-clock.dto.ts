import { employee_shift_clock_status } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class QueryEmployeeShiftClockDto extends PaginationDto {
    @IsOptional()
    @IsString()
    employee_id?: string;

    @IsOptional()
    @IsDateString()
    date?: string;

    @IsOptional()
    @IsString()
    partner_id?: string;

    @IsOptional()
    @IsEnum(employee_shift_clock_status)
    status?: employee_shift_clock_status;
}
