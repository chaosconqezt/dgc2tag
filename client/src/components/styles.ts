export const FONT = 'Inter, system-ui, sans-serif';
export const FS = '14px';

export const COLORS = {
  bg: '#111114',
  border: '#27272a',
  borderLight: '#1f1f23',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  textFaint: '#52525b',
  textInvisible: '#3f3f46',
  green: '#4ade80',
  yellow: '#fbbf24',
  red: '#ef4444',
  purple: '#a78bfa',
  inputBg: '#18181b',
  inputBgAlt: '#0c0c0e',
  inputBgAlt2: '#0f0f12',
  greenBg: 'rgba(74,222,128,0.05)',
  greenBorder: 'rgba(74,222,128,0.2)',
  purpleBg: 'rgba(167,139,250,0.05)',
  purpleBorder: 'rgba(167,139,250,0.2)',
} as const;

export const CHECKBOX = {
  accentColor: '#ef4444',
  width: '11px',
  height: '11px',
  cursor: 'pointer' as const,
};

export const CELL_STYLE = {
  padding: '3px 6px',
  borderRadius: '3px',
  fontSize: FS,
  border: `1px solid ${COLORS.borderLight}`,
  backgroundColor: COLORS.inputBg,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
  fontFamily: FONT,
};

export const INPUT_STYLE = {
  padding: '3px 6px',
  borderRadius: '3px',
  fontSize: FS,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
  fontFamily: FONT,
};

export const PERCENT_STYLE = {
  textAlign: 'center' as const,
  fontSize: FS,
  fontWeight: '600' as const,
  fontFamily: 'monospace',
  minWidth: '40px',
};

export const simColor = (sim: number) => sim === 100 ? COLORS.green : sim >= 80 ? COLORS.yellow : COLORS.red;

export const HEADER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  marginBottom: '8px',
  paddingBottom: '6px',
  borderBottom: `1px solid ${COLORS.borderLight}`,
};

export const PANEL_STYLE = {
  padding: '10px',
  background: COLORS.bg,
  borderRadius: '8px',
  border: `1px solid ${COLORS.border}`,
  marginBottom: '10px',
};

export const GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: '11px 1fr 40px 1fr',
  gap: '4px',
  alignItems: 'center',
};

export const ROW_STYLE = (enabled: boolean) => ({
  marginBottom: '4px',
  opacity: enabled ? 1 : 0.95,
});
