import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateServiceDto {
  @ApiProperty({ example: 'Haircut', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 50.0, minimum: 0.01, required: false })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  defaultPrice?: number;

  @ApiProperty({ example: 'Professional haircut service', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

