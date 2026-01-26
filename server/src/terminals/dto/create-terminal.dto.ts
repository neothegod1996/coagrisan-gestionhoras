import { IsNotEmpty, IsString } from "class-validator";

export class CreateTerminalDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    external_id: string;

    @IsNotEmpty()
    @IsString()
    partner_id: string;
}