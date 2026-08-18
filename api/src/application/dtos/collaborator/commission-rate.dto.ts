import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CollaboratorCommissionRateInputDto {
  @ApiProperty({ example: 'rate-id-123', required: false })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'Nail Designer' })
  @IsString()
  name: string;

  @ApiProperty({ example: 40, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}
