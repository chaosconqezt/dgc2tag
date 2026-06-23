import { BUILD, CHANGES } from '../build';
import { FONT, FS, COLORS } from './styles';

export function Footer() {
  return (
    <div style={{
      borderTop: `1px solid ${COLORS.border}`,
      padding: '6px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: COLORS.inputBgAlt,
      fontFamily: FONT,
      fontSize: FS,
      color: COLORS.textDim,
      flexShrink: 0,
    }}>
      <span style={{ color: COLORS.textMuted }}>Build {BUILD}</span>
      <span style={{ color: COLORS.textInvisible }}>|</span>
      <span>{CHANGES[BUILD] || ''}</span>
    </div>
  );
}
