import { turnover_type } from "@prisma/client";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateTurnoverDto {
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsNotEmpty()
    @IsEnum(turnover_type)
    type: turnover_type;

    @IsNotEmpty()
    @IsUUID()
    employee_id: string;
}
