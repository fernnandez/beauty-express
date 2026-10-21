import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialBrandingDto } from '../admin/branding.dto';

export class QuickReplyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(60)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  message: string;
}

export class PriceListDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  message: string;
}

/**
 * Configurações editáveis pelo próprio tenant (área operacional, admin):
 * branding + regime de período e dias de pagamento das comissões.
 * As demais features (comissões habilitadas, modo de relatório) seguem
 * exclusivas do backoffice.
 */
export class OperationalFeatureSettingsDto {
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

  @ApiProperty({ required: false, type: [QuickReplyDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QuickReplyDto)
  quickReplies?: QuickReplyDto[];

  @ApiProperty({ required: false, type: PriceListDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PriceListDto)
  priceList?: PriceListDto;

  @ApiProperty({ required: false, enum: ['compact', 'comfortable'] })
  @IsOptional()
  @IsIn(['compact', 'comfortable'])
  chatDensity?: 'compact' | 'comfortable';
}

export class UpdateSettingsDto {
  @ApiProperty({ required: false, type: PartialBrandingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartialBrandingDto)
  branding?: PartialBrandingDto;

  @ApiProperty({ required: false, type: OperationalFeatureSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperationalFeatureSettingsDto)
  features?: OperationalFeatureSettingsDto;
}
