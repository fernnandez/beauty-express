import { useEffect } from 'react';
import type { LoginBranding, TenantBranding } from '../types/branding.types';
import {
  applyDocumentBranding,
  resetDocumentBranding,
} from '../utils/document-branding.util';

type DocumentBranding = Pick<
  TenantBranding | LoginBranding,
  'displayName' | 'logoUrl'
>;

export function useDocumentBranding(
  branding: DocumentBranding,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    applyDocumentBranding(branding);

    return () => {
      resetDocumentBranding();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- depende dos campos primitivos do branding, não do objeto inteiro
  }, [
    enabled,
    branding.displayName,
    branding.logoUrl,
  ]);
}
