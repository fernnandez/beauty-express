import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@domain/entities/user-role.enum';
import { SettingsService } from '@domain/services/settings.service';
import { UpdateSettingsDto } from '../dtos/settings/update-settings.dto';

@ApiTags('Settings')
@Controller('settings')
@Roles(UserRole.ADMIN)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Configurações do tenant do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Configurações atuais' })
  async getSettings() {
    return await this.settingsService.getSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Atualizar branding do próprio tenant' })
  @ApiResponse({ status: 200, description: 'Configurações atualizadas' })
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return await this.settingsService.updateSettings({
      branding: dto.branding,
      features: dto.features,
    });
  }
}
