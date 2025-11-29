import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

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

  @ApiProperty({ example: 15, minimum: 0, maximum: 100, required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionPercentage?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
