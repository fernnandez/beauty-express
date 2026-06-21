const DEV_PORTAL_HOST_KEY = 'beauty_express_dev_portal_host';

export function isLocalDevHost(): boolean {
  const hostname = window.location.hostname.trim().toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function isDevPortalPickerEnabled(): boolean {
  return import.meta.env.DEV && isLocalDevHost();
}

export function getDevPortalHostOverride(): string | null {
  if (!isDevPortalPickerEnabled()) {
    return null;
  }

  return sessionStorage.getItem(DEV_PORTAL_HOST_KEY);
}

export function setDevPortalHostOverride(host: string): void {
  if (!isDevPortalPickerEnabled()) {
    return;
  }

  sessionStorage.setItem(DEV_PORTAL_HOST_KEY, host.trim());
}

export function getPortalHost(): string {
  const devOverride = getDevPortalHostOverride();
  if (devOverride) {
    return devOverride;
  }

  const override = import.meta.env.VITE_PORTAL_HOST?.trim();
  if (override) {
    return override;
  }

  const hostname = window.location.hostname.trim().toLowerCase();

  if (hostname === '127.0.0.1') {
    return 'localhost';
  }

  return hostname;
}

/** Host padrão ao abrir o seletor de portal em localhost (dev). */
export function getDefaultDevPortalHost(): string {
  return (
    import.meta.env.VITE_PORTAL_HOST?.trim() ||
    'mariaborboleta.fernnandez.com'
  );
}
