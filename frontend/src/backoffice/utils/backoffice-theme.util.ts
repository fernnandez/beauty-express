export const BACKOFFICE_NAME = 'Agendor';
export const BACKOFFICE_TAGLINE = 'Sistema de agendamentos e comissões';

export const backofficeColors = {
  // Dark mode suave (grafite), com contraste reduzido para leitura confortável.
  bg: '#1a1a1f',
  surface: '#212128',
  surfaceMuted: '#2a2a32',
  inputBg: '#2a2a32',
  inputBgFocus: '#32323b',
  border: '#303039',
  borderStrong: '#3c3c47',
  navbar: '#1d1d23',
  // Accent de marca (violeta) nas interações de navegação.
  navActiveBg: 'rgba(168, 85, 247, 0.18)',
  navHoverBg: 'rgba(255, 255, 255, 0.05)',
  navText: '#9a9aa5',
  navTextActive: '#ededf2',
  textPrimary: '#e6e6ea',
  textSecondary: '#b4b4bf',
  textMuted: '#8a8a95',
  placeholder: '#5e5e68',
  tableHeader: '#2a2a32',
  tableHeaderText: '#d6d6dd',
  tableCell: '#212128',
  tableCellText: '#d8d8df',
} as const;

export const backofficeCardStyle = {
  borderColor: backofficeColors.border,
  backgroundColor: backofficeColors.surface,
};

export const backofficeTableStyles = {
  th: {
    backgroundColor: backofficeColors.tableHeader,
    color: backofficeColors.tableHeaderText,
  },
  td: {
    backgroundColor: backofficeColors.tableCell,
    color: backofficeColors.tableCellText,
  },
};

export const backofficeLoginGradient =
  'linear-gradient(145deg, #0b0b0f 0%, #17171d 55%, #2a2440 100%)';

/** Cor Mantine padrão do backoffice (accent de marca: violeta). */
export const backofficeAccent = 'violet' as const;

const inputBaseStyles = {
  label: { color: backofficeColors.textSecondary, fontWeight: 500 },
  description: { color: backofficeColors.textMuted },
  error: { color: '#fca5a5' },
  input: {
    color: backofficeColors.textPrimary,
    backgroundColor: backofficeColors.inputBg,
    borderColor: backofficeColors.borderStrong,
    '&::placeholder': { color: backofficeColors.placeholder },
    '&:focus': {
      borderColor: '#64748b',
      backgroundColor: backofficeColors.inputBgFocus,
    },
    '&:disabled': {
      backgroundColor: backofficeColors.surfaceMuted,
      color: backofficeColors.textMuted,
    },
  },
  section: { color: backofficeColors.textMuted },
  innerInput: {
    color: backofficeColors.textPrimary,
  },
};

export const backofficeInputStyles = inputBaseStyles;

export const backofficeSelectStyles = {
  ...inputBaseStyles,
  dropdown: {
    backgroundColor: backofficeColors.surface,
    borderColor: backofficeColors.borderStrong,
  },
  option: {
    color: backofficeColors.textPrimary,
  },
};

export const backofficeColorInputStyles = {
  ...inputBaseStyles,
};

export const backofficeSwitchStyles = {
  label: { color: backofficeColors.textSecondary, fontWeight: 500 },
  description: { color: backofficeColors.textMuted },
  track: {
    backgroundColor: backofficeColors.inputBg,
    borderColor: backofficeColors.borderStrong,
  },
};

export const backofficeDividerStyles = {
  label: {
    color: backofficeColors.textMuted,
    fontSize: '0.75rem',
    fontWeight: 500,
  },
};

export const backofficePreviewCardStyle = {
  borderColor: backofficeColors.borderStrong,
  backgroundColor: backofficeColors.surfaceMuted,
};

export const backofficeTabsStyles = {
  list: {
    gap: 6,
    backgroundColor: backofficeColors.surfaceMuted,
    border: `1px solid ${backofficeColors.border}`,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    color: backofficeColors.textMuted,
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    borderRadius: 6,
    fontWeight: 500,
    transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
    '&:hover': {
      backgroundColor: backofficeColors.inputBg,
      color: backofficeColors.textSecondary,
    },
    '&[data-active]': {
      color: backofficeColors.textPrimary,
      backgroundColor: backofficeColors.inputBg,
      borderColor: backofficeColors.borderStrong,
    },
  },
};

export const backofficeTabsProps = {
  color: backofficeAccent,
  variant: 'pills' as const,
  styles: backofficeTabsStyles,
};
