import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { BrandingDto, PartialBrandingDto } from './branding.dto';

export class TenantFeatureSettingsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  commissionsEnabled: boolean;

  @ApiProperty({ enum: ['full', 'revenue_only'], example: 'full' })
  @IsIn(['full', 'revenue_only'])
  financialReportsMode: 'full' | 'revenue_only';
}

export class PartialTenantFeatureSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  commissionsEnabled?: boolean;

  @ApiProperty({ required: false, enum: ['full', 'revenue_only'] })
  @IsOptional()
  @IsIn(['full', 'revenue_only'])
  financialReportsMode?: 'full' | 'revenue_only';
}

export class TenantSettingsDto {
  @ApiProperty({ type: BrandingDto })
  @ValidateNested()
  @Type(() => BrandingDto)
  branding: BrandingDto;

  @ApiProperty({ type: TenantFeatureSettingsDto })
  @ValidateNested()
  @Type(() => TenantFeatureSettingsDto)
  features: TenantFeatureSettingsDto;
}

export class PartialTenantSettingsDto {
  @ApiProperty({ required: false, type: PartialBrandingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartialBrandingDto)
  branding?: PartialBrandingDto;

  @ApiProperty({ required: false, type: PartialTenantFeatureSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartialTenantFeatureSettingsDto)
  features?: PartialTenantFeatureSettingsDto;
}
