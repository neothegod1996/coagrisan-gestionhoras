import { PaginationDto } from "src/common/dto/pagination.dto";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { connection_status } from "@prisma/client";

export class PaginationTerminalsDto extends PaginationDto {

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(connection_status)
    connection_status?: connection_status;

    @IsOptional()
    @IsUUID()
    partner_id?: string;
}