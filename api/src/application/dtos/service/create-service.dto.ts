import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Haircut' })
  @IsString()
  name: string;

  @ApiProperty({ example: 50.0, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'defaultPrice must be a number with at most 2 decimal places' },
  )
  @Min(0.01, { message: 'defaultPrice must be greater than 0.01' })
  defaultPrice: number;

  @ApiProperty({ example: 'Professional haircut service', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

