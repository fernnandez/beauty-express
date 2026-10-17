import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { PartialTenantSettingsDto } from './tenant-settings.dto';

export class UpdateTenantDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug?: string;

  @ApiProperty({ required: false, type: PartialTenantSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartialTenantSettingsDto)
  settings?: PartialTenantSettingsDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
