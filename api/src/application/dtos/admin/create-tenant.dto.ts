import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'paulista' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug: string;

  @ApiProperty({ example: 'Maria Borboleta - Paulista' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
