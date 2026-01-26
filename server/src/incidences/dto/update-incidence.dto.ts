import { PartialType } from '@nestjs/mapped-types';
import { CreateIncidenceDto } from './create-incidence.dto';

export class UpdateIncidenceDto extends PartialType(CreateIncidenceDto) {}
