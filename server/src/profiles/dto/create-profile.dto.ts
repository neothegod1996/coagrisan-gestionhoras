import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { status } from "@prisma/client";

export class CreateProfileDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(status)
  status?: status;

  @IsOptional()
  @IsUUID()
  partner_id?: string;
}
