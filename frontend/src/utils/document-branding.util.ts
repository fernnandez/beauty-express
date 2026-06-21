import type { LoginBranding, TenantBranding } from '../types/branding.types';

export const DEFAULT_DOCUMENT_TITLE = 'Beauty Express';
export const DEFAULT_FAVICON_HREF = '/logo.png';

function resolveFaviconHref(
  branding: Pick<TenantBranding | LoginBranding, 'logoUrl'>,
): string {
  const logo = branding.logoUrl?.trim();
  if (logo) {
    return logo;
  }

  return DEFAULT_FAVICON_HREF;
}

function resolveDocumentTitle(displayName?: string | null): string {
  const name = displayName?.trim();
  return name || DEFAULT_DOCUMENT_TITLE;
}

export function applyDocumentBranding(
  branding: Pick<TenantBranding | LoginBranding, 'displayName' | 'logoUrl'>,
): void {
  document.title = resolveDocumentTitle(branding.displayName);

  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  link.href = resolveFaviconHref(branding);
}

export function resetDocumentBranding(): void {
  document.title = DEFAULT_DOCUMENT_TITLE;

  const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (link) {
    link.href = DEFAULT_FAVICON_HREF;
  }
}
