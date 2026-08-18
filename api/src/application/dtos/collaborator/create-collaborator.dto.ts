import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CollaboratorCommissionRateInputDto } from './commission-rate.dto';

export class CreateCollaboratorDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '(11) 99999-9999' })
  @IsString()
  phone: string;

  @ApiProperty({
    example: 'Hairdresser',
    description: 'Area of expertise (e.g., Hairdresser, Nail Designer, etc.)',
  })
  @IsString()
  area: string;

  @ApiProperty({
    type: [CollaboratorCommissionRateInputDto],
    required: false,
    description: 'Commission rates that can be selected when assigning a service',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollaboratorCommissionRateInputDto)
  @IsOptional()
  commissionRates?: CollaboratorCommissionRateInputDto[];
}
