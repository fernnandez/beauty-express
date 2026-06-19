export interface LoginBranding {
  displayName: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  accentColor: string;
}

export interface TenantBranding {
  displayName: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  accentColor: string;
}

export interface PortalResolveResponse {
  id: string;
  slug: string;
  host: string;
  loginBranding: LoginBranding;
}
