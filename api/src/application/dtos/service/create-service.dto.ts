import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Haircut' })
  @IsString()
  name: string;

  @ApiProperty({ example: 50.0, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  defaultPrice: number;

  @ApiProperty({ example: 'Professional haircut service', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

