import { Module } from '@nestjs/common';
import { SettingsController } from '@application/controllers/settings.controller';
import { SettingsService } from '../services/settings.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
