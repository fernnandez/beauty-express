import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@paulista.mariaborboleta.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'mariaborboleta.fernnandez.com',
    description: 'Host do portal de login (subdomínio)',
  })
  @IsString()
  @MinLength(1)
  portalHost: string;
}
