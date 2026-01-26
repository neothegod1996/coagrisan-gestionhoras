import { Transform } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";

export class PaginationDto {
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    page: number = 1;

    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    limit: number = 10;
}