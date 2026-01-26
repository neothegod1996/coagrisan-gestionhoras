import { PaginationDto } from "src/common/dto/pagination.dto";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { shift_type } from "@prisma/client";

export class PaginationScheduleDto extends PaginationDto {
    @IsOptional()
    @IsEnum(shift_type)
    shift_type?: shift_type;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsUUID()
    partner_id?: string;
}