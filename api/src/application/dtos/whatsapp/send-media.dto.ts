import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Tipos de mídia que o atendente pode enviar. */
export const SENDABLE_MEDIA_TYPES = [
  'image',
  'audio',
  'video',
  'document',
] as const;

export class SendMediaDto {
  @ApiProperty({ description: 'Conteúdo do arquivo em base64 (sem data URL).' })
  @IsString()
  base64: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @MaxLength(100)
  mime: string;

  @ApiProperty({ enum: SENDABLE_MEDIA_TYPES })
  @IsIn(SENDABLE_MEDIA_TYPES)
  type: (typeof SENDABLE_MEDIA_TYPES)[number];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  caption?: string;
}
