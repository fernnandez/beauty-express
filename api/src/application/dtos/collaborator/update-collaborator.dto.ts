import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CollaboratorCommissionRateInputDto } from './commission-rate.dto';

export class UpdateCollaboratorDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '(11) 99999-9999', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Hairdresser',
    description: 'Area of expertise (e.g., Hairdresser, Nail Designer, etc.)',
    required: false,
  })
  @IsString()
  @IsOptional()
  area?: string;

  @ApiProperty({
    type: [CollaboratorCommissionRateInputDto],
    required: false,
    description: 'Replaces the collaborator commission rates when provided',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollaboratorCommissionRateInputDto)
  @IsOptional()
  commissionRates?: CollaboratorCommissionRateInputDto[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
