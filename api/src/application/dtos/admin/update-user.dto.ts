import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@domain/entities/user-role.enum';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: 'Nova senha (mín. 6 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ required: false, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  @IsNotIn([UserRole.SUPER_ADMIN], {
    message: 'Não é permitido promover usuário a super admin',
  })
  role?: UserRole;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
