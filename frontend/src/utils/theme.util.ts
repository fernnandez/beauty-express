import { createTheme, type MantineColorsTuple, type MantineThemeOverride } from '@mantine/core';

const DEFAULT_PRIMARY = '#e64980';
const DEFAULT_ACCENT = '#faf5ff';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

function mix(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }

  const target = amount >= 0 ? 255 : 0;
  const ratio = Math.abs(amount);

  return rgbToHex(
    rgb.r + (target - rgb.r) * ratio,
    rgb.g + (target - rgb.g) * ratio,
    rgb.b + (target - rgb.b) * ratio,
  );
}

function createColorScale(base: string): MantineColorsTuple {
  return [
    mix(base, 0.9),
    mix(base, 0.75),
    mix(base, 0.6),
    mix(base, 0.45),
    mix(base, 0.3),
    mix(base, 0.15),
    base,
    mix(base, -0.1),
    mix(base, -0.25),
    mix(base, -0.4),
  ];
}

export function createBrandingTheme(
  primaryColor = DEFAULT_PRIMARY,
): MantineThemeOverride {
  const safePrimary = hexToRgb(primaryColor) ? primaryColor : DEFAULT_PRIMARY;

  return createTheme({
    primaryColor: 'brand',
    colors: {
      brand: createColorScale(safePrimary),
    },
    defaultRadius: 'md',
  });
}

export function createLoginBackground(primaryColor: string, accentColor: string) {
  return `linear-gradient(135deg, ${accentColor} 0%, ${mix(primaryColor, 0.92)} 50%, #fefefe 100%)`;
}

export const DEFAULT_LOGIN_BRANDING = {
  displayName: 'Beauty Express',
  logoUrl: '/logo.png',
  primaryColor: DEFAULT_PRIMARY,
  accentColor: DEFAULT_ACCENT,
};

export function getNavbarBackground(accentColor: string): string {
  return accentColor || DEFAULT_ACCENT;
}

export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return hex;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
