import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { PartialBrandingDto } from '../admin/branding.dto';

/**
 * Atualização de configurações pelo próprio tenant (área operacional).
 * Por ora, apenas o branding é editável — as features (comissões, modo de
 * relatório) seguem exclusivas do backoffice.
 */
export class UpdateSettingsDto {
  @ApiProperty({ required: false, type: PartialBrandingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartialBrandingDto)
  branding?: PartialBrandingDto;
}
