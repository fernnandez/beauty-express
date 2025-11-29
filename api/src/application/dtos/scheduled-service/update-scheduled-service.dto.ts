import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateScheduledServiceDto {
  @ApiProperty({ example: 'service-id-123', required: false })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({ example: 'collaborator-id-123', required: false })
  @IsString()
  @IsOptional()
  collaboratorId?: string;

  @ApiProperty({ example: 50.0, required: false, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  price?: number;
}
