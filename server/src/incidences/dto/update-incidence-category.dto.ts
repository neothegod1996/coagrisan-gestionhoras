import { PartialType } from '@nestjs/swagger';
import { CreateIncidenceCategoryDto } from './create-incidence-category.dto';

export class UpdateIncidenceCategoryDto extends PartialType(CreateIncidenceCategoryDto) {}
