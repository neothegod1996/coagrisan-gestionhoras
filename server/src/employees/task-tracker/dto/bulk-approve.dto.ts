import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkApproveDto {
  @ApiProperty({
    description: 'Array of task tracker IDs to approve',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
