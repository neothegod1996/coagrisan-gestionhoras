import { PartialType } from '@nestjs/mapped-types';
import { CreateTurnoverDto } from './create-turnover.dto';

export class UpdateTurnoverDto extends PartialType(CreateTurnoverDto) {}
