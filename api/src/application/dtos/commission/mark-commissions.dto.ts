import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class MarkCommissionsDto {
  @ApiProperty({
    example: ['commission-id-1', 'commission-id-2'],
    description: 'Array of commission IDs to mark',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  commissionIds: string[];
}
