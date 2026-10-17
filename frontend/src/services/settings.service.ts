import { api } from "../config/api";
import type { TenantBranding } from "../types/branding.types";
import type { TenantSettings } from "../types/tenant-settings.types";

export interface UpdateSettingsDto {
  branding?: Partial<TenantBranding>;
}

export const settingsService = {
  get: async (): Promise<TenantSettings> => {
    const response = await api.get<TenantSettings>("/settings");
    return response.data;
  },

  update: async (dto: UpdateSettingsDto): Promise<TenantSettings> => {
    const response = await api.patch<TenantSettings>("/settings", dto);
    return response.data;
  },
};
