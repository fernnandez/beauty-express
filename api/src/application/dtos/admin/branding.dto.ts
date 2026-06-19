import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export class BrandingDto {
  @ApiProperty({ example: 'Maria Borboleta' })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({ required: false, nullable: true, example: '/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  faviconUrl?: string | null;

  @ApiProperty({ example: '#e64980' })
  @IsString()
  @Matches(HEX_COLOR, { message: 'primaryColor deve ser um hex (#RRGGBB)' })
  primaryColor: string;

  @ApiProperty({ example: '#faf5ff' })
  @IsString()
  @Matches(HEX_COLOR, { message: 'accentColor deve ser um hex (#RRGGBB)' })
  accentColor: string;
}

export class PartialBrandingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  displayName?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  faviconUrl?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR, { message: 'primaryColor deve ser um hex (#RRGGBB)' })
  primaryColor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR, { message: 'accentColor deve ser um hex (#RRGGBB)' })
  accentColor?: string;
}
