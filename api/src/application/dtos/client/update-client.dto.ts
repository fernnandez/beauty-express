import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateClientDto {
  @ApiProperty({ example: 'Maria Silva', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '(11) 99999-9999', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
