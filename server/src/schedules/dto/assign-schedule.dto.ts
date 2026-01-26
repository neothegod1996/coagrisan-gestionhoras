import { IsArray, IsOptional, IsString, IsUUID } from "class-validator";

export class AssignScheduleDto {
    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    profile_ids: string[];

    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    employee_ids: string[];

    @IsOptional()
    @IsString()
    partner_id?: string;
}