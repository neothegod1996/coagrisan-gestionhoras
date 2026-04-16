import { IsArray, IsBoolean, IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateEmployeeDto {
    @IsNotEmpty()
    @IsString()
    card_id: string;

    @IsOptional()
    @IsString()
    employee_code?: string;

    @IsString()
    @IsNotEmpty()
    first_name: string;

    @IsNotEmpty()
    @IsString()
    last_name: string;

    @IsNotEmpty()
    @IsString()
    dni: string;

    @IsNotEmpty()
    @IsDateString()
    birth_date: Date;

    @IsNotEmpty()
    @IsString()
    address: string;

    @IsNotEmpty()
    @IsString()
    postal_code: string;

    @IsNotEmpty()
    @IsString()
    province: string;

    @IsNotEmpty()
    @IsString()
    population: string;

    @IsNotEmpty()
    @IsString()
    phone_number: string;

    @IsNotEmpty()
    @IsString()
    mobile_number: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    partner_id?: string;

    @IsNotEmpty()
    @IsString()
    profile_id: string;

    @IsNotEmpty()
    @IsString()
    schedule_id: string;

    @IsNotEmpty()
    @IsString()
    location_id: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    agreement_ids?: string[];

    @IsOptional()
    @IsBoolean()
    is_responsible?: boolean;
}
