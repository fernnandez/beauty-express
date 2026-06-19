import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { BrandingDto } from './branding.dto';

export class CreatePortalDto {
  @ApiProperty({ example: 'mariaborboleta' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug: string;

  @ApiProperty({ example: 'mariaborboleta.fernnandez.com' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9.-]+$/, {
    message: 'host inválido (use apenas domínio, sem protocolo)',
  })
  host: string;

  @ApiProperty({ type: BrandingDto })
  @ValidateNested()
  @Type(() => BrandingDto)
  loginBranding: BrandingDto;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
