export const FONT = 'Inter, system-ui, sans-serif';
export const FS = '14px';

export const COLORS = {
  bg: 'var(--bg)',
  cardBg: 'var(--card-bg)',
  border: 'var(--border)',
  borderLight: 'var(--border-light)',
  text: 'var(--text)',
  textMuted: 'var(--text-muted)',
  textDim: 'var(--text-dim)',
  textFaint: 'var(--text-faint)',
  textInvisible: 'var(--text-invisible)',
  green: 'var(--green)',
  yellow: 'var(--yellow)',
  red: 'var(--red)',
  purple: 'var(--purple)',
  inputBg: 'var(--input-bg)',
  inputBgAlt: 'var(--input-bg-alt)',
  inputBgAlt2: 'var(--input-bg-alt2)',
  greenBg: 'var(--green-bg)',
  greenBorder: 'var(--green-border)',
  purpleBg: 'var(--purple-bg)',
  purpleBorder: 'var(--purple-border)',
} as const;

export const CHECKBOX = {
  accentColor: 'var(--red)',
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

export const ICON_BUTTON = {
  background: 'none',
  border: 'none',
  color: COLORS.textDim,
  cursor: 'pointer',
};

export const OVERLAY_BACKDROP = {
  position: 'fixed' as const,
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(4px)',
};

export const MODAL_PANEL = {
  backgroundColor: COLORS.inputBg,
  borderRadius: '10px',
  border: `1px solid ${COLORS.border}`,
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden',
};
