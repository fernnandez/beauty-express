export function getPortalHost(): string {
  const override = import.meta.env.VITE_PORTAL_HOST?.trim();
  if (override) {
    return override;
  }

  const hostname = window.location.hostname.trim().toLowerCase();

  // Vite/dev: tratar 127.0.0.1 como localhost (portal seed)
  if (hostname === '127.0.0.1') {
    return 'localhost';
  }

  return hostname;
}
