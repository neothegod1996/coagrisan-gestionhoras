import { PaginationDto } from "src/common/dto/pagination.dto";
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { turnover_type } from "@prisma/client";

export class PaginationTurnoverDto extends PaginationDto {
    @IsOptional()
    @IsDateString()
    date?: string;

    @IsOptional()
    @IsEnum(turnover_type)
    type?: turnover_type;

    @IsOptional()
    @IsUUID()
    employee_id?: string;

    @IsOptional()
    @IsString()
    search?: string;
}