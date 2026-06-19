import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { PartialBrandingDto } from './branding.dto';

export class UpdatePortalDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9.-]+$/, {
    message: 'host inválido (use apenas domínio, sem protocolo)',
  })
  host?: string;

  @ApiProperty({ required: false, type: PartialBrandingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartialBrandingDto)
  loginBranding?: PartialBrandingDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
