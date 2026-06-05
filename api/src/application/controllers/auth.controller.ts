import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AdminLoginDto } from '@application/dtos/auth/admin-login.dto';
import { LoginDto } from '@application/dtos/auth/login.dto';
import { RefreshTokenDto } from '@application/dtos/auth/refresh-token.dto';
import { RefreshTokenAudience } from '@domain/entities/refresh-token.entity';
import { AuthService } from '@domain/services/auth.service';
import { AccessTokenPayload } from '@domain/services/auth.types';
import { SuperAdminGuard } from '@common/guards/super-admin.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login operacional (e-mail + senha)' })
  async login(@Body() dto: LoginDto) {
    return await this.authService.loginOperational(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar tokens operacionais' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return await this.authService.refresh(dto, RefreshTokenAudience.OPERATIONAL);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout operacional' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken, RefreshTokenAudience.OPERATIONAL);
  }

  @Get('me')
  @ApiOperation({ summary: 'Perfil do usuário autenticado' })
  async me(@CurrentUser() user: AccessTokenPayload) {
    return await this.authService.getMe(user.sub);
  }

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login do backoffice (super admin)' })
  async adminLogin(@Body() dto: AdminLoginDto) {
    return await this.authService.loginAdmin(dto);
  }

  @Public()
  @Post('admin/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar tokens do backoffice' })
  async adminRefresh(@Body() dto: RefreshTokenDto) {
    return await this.authService.refresh(dto, RefreshTokenAudience.ADMIN);
  }

  @Public()
  @Post('admin/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout do backoffice' })
  async adminLogout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken, RefreshTokenAudience.ADMIN);
  }

  @Get('admin/me')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Perfil do super admin autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil retornado' })
  async adminMe(@CurrentUser() user: AccessTokenPayload) {
    return await this.authService.getMe(user.sub);
  }
}
