import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateServiceDto {
  @ApiProperty({ example: 'Haircut', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 50.0, minimum: 0.01, required: false })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'defaultPrice must be a number with at most 2 decimal places' },
  )
  @Min(0.01, { message: 'defaultPrice must be greater than 0.01' })
  @IsOptional()
  defaultPrice?: number;

  @ApiProperty({ example: 'Professional haircut service', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

