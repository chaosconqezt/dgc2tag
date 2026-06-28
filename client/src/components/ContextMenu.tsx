import { useEffect, useRef } from 'react';
import { FONT, FS, COLORS } from './styles';

export interface ContextMenuItem {
  label: string;
  action: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Keep menu within viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 10000,
    minWidth: '140px',
    backgroundColor: COLORS.inputBg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '4px 0',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    fontFamily: FONT,
    fontSize: FS,
  };

  return (
    <div ref={ref} style={style}>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.action(); onClose(); }}
          style={{
            display: 'block',
            width: '100%',
            padding: '6px 12px',
            background: 'none',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: FONT,
            fontSize: FS,
            color: item.danger ? COLORS.red : COLORS.text,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.borderLight)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
