import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'owner@beautyexpress.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SenhaAdmin123!' })
  @IsString()
  @MinLength(6)
  password: string;
}
