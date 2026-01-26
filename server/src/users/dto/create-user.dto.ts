import { role } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    @IsEnum(role)
    role: role;
}
