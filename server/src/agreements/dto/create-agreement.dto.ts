import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAgreementDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  saturday_is_holiday?: boolean;

  @IsBoolean()
  @IsOptional()
  sunday_is_holiday?: boolean;

  @IsUUID()
  @IsOptional()
  partner_id?: string;
}
