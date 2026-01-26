import { incidence_type } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export enum IncidenceShowEnum {
    All = 'all',
    Upcoming = 'upcoming',
}

export class QueryIncidenceDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(IncidenceShowEnum)
    show: IncidenceShowEnum = IncidenceShowEnum.All;

    @IsOptional()
    @IsEnum(incidence_type)
    type?: incidence_type;

    @IsOptional()
    @IsDateString()
    date: string;

    @IsOptional()
    @IsString()
    employee_id?: string;

    @IsOptional()
    @IsString()
    partner_id?: string;
}