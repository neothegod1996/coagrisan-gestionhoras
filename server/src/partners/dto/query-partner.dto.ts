import { PaginationDto } from "src/common/dto/pagination.dto";
import { IsOptional, IsString } from "class-validator";

export class PaginationPartnerDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;
}