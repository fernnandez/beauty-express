import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
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

  @ApiProperty({ enum: ['biweekly', 'monthly'], example: 'biweekly' })
  @IsIn(['biweekly', 'monthly'])
  periodMode: 'biweekly' | 'monthly';

  @ApiProperty({ required: false, type: [Number], example: [15, 30] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  commissionPayoutDays?: number[];
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

  @ApiProperty({ required: false, enum: ['biweekly', 'monthly'] })
  @IsOptional()
  @IsIn(['biweekly', 'monthly'])
  periodMode?: 'biweekly' | 'monthly';

  @ApiProperty({ required: false, type: [Number], example: [15, 30] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  commissionPayoutDays?: number[];
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
