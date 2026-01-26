import { PaginationDto } from "src/common/dto/pagination.dto";
import { IsOptional, IsString } from "class-validator";

export class PaginationEmployeeDto extends PaginationDto {
    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    profile?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    partner_id?: string;
}