import { IsString, IsOptional, IsBoolean, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { incidence_type } from '@prisma/client';

export class CreateIncidenceCategoryDto {
  @ApiProperty({
    description: 'Name of the incidence category',
    example: 'Vacaciones',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the category',
    example: 'Días de vacaciones pagadas',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether this category is paid by default',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  paid?: boolean;

  @ApiProperty({
    description: 'Partner ID to associate this category with',
    required: false,
  })
  @ApiProperty({
    description: 'Incidence type that determines calculation behavior',
    enum: incidence_type,
    default: incidence_type.other,
    required: false,
  })
  @IsEnum(incidence_type)
  @IsOptional()
  type?: incidence_type;

  @IsString()
  @IsOptional()
  partner_id?: string;
}
