export const BACKOFFICE_NAME = 'Agendor';
export const BACKOFFICE_TAGLINE = 'Sistema de agendamentos e comissões';

export const backofficeColors = {
  // Light mode: base clara e suave, superfícies brancas, contraste confortável.
  bg: '#f6f6f8',
  surface: '#ffffff',
  surfaceMuted: '#f1f1f4',
  inputBg: '#ffffff',
  inputBgFocus: '#ffffff',
  border: '#e6e6ec',
  borderStrong: '#d4d4dd',
  navbar: '#ffffff',
  // Accent de marca (violeta) nas interações de navegação.
  navActiveBg: 'rgba(124, 58, 237, 0.12)',
  navHoverBg: 'rgba(0, 0, 0, 0.04)',
  navText: '#6b6b76',
  navTextActive: '#6d28d9',
  textPrimary: '#1f1f29',
  textSecondary: '#44444f',
  textMuted: '#787884',
  placeholder: '#9a9aa5',
  tableHeader: '#f1f1f4',
  tableHeaderText: '#44444f',
  tableCell: '#ffffff',
  tableCellText: '#2a2a33',
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
  'linear-gradient(145deg, #faf5ff 0%, #f3e8ff 55%, #ede9fe 100%)';

/** Cor Mantine padrão do backoffice (accent de marca: violeta). */
export const backofficeAccent = 'violet' as const;

const inputBaseStyles = {
  label: { color: backofficeColors.textSecondary, fontWeight: 500 },
  description: { color: backofficeColors.textMuted },
  error: { color: '#dc2626' },
  input: {
    color: backofficeColors.textPrimary,
    backgroundColor: backofficeColors.inputBg,
    borderColor: backofficeColors.borderStrong,
    '&::placeholder': { color: backofficeColors.placeholder },
    '&:focus': {
      borderColor: '#8b5cf6',
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
