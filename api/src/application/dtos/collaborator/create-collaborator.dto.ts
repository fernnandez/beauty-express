import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max } from 'class-validator';

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

  @ApiProperty({ example: 15, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercentage: number;
}
