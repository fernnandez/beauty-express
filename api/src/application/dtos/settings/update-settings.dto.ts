import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialBrandingDto } from '../admin/branding.dto';

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
