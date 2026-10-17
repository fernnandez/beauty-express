import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class GrantCollaboratorAccessDto {
  @ApiProperty({ example: 'maria@salao.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha123!' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateCollaboratorAccessDto {
  @ApiProperty({ required: false, example: 'maria@salao.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: 'NovaSenha123!' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
