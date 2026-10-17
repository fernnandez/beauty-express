import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from '@domain/services/settings.service';
import { UpdateSettingsDto } from '../dtos/settings/update-settings.dto';

@ApiTags('Settings')
@Controller('settings')
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
    return await this.settingsService.updateBranding(dto.branding);
  }
}
