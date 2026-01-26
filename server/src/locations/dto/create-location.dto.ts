import { status } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';

export class CreateLocationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(status)
  status: status;

  @IsOptional()
  @IsUUID()
  partner_id?: string;
}
