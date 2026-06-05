import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@domain/entities/user-role.enum';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'gerente@paulista.mariaborboleta.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false, description: 'Obrigatório para roles operacionais' })
  @ValidateIf((dto: CreateUserDto) => dto.role !== UserRole.SUPER_ADMIN)
  @IsUUID()
  @IsNotEmpty()
  tenantId?: string;
}
