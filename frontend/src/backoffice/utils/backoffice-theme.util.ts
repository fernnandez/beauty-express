export const BACKOFFICE_NAME = 'Agendor';
export const BACKOFFICE_TAGLINE = 'Sistema de agendamentos e comissões';

export const backofficeColors = {
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceMuted: '#293548',
  inputBg: '#334155',
  inputBgFocus: '#3d4f66',
  border: '#334155',
  borderStrong: '#475569',
  navbar: '#1e293b',
  navActiveBg: 'rgba(148, 163, 184, 0.18)',
  navHoverBg: 'rgba(148, 163, 184, 0.1)',
  navText: '#94a3b8',
  navTextActive: '#f1f5f9',
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  placeholder: '#64748b',
  tableHeader: '#1e293b',
  tableHeaderText: '#e2e8f0',
  tableCell: '#0f172a',
  tableCellText: '#f1f5f9',
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
  'linear-gradient(145deg, #0f172a 0%, #1e293b 55%, #334155 100%)';

/** Cor Mantine padrão do backoffice (neutra). */
export const backofficeAccent = 'gray' as const;

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
