import { PaginationDto } from "src/common/dto/pagination.dto";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { status } from "@prisma/client";

export class PaginationProfileDto extends PaginationDto {
    @IsOptional()
    @IsEnum(status)
    status?: status;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsUUID()
    partner_id?: string;
}