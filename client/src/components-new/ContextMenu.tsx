import { useEffect, useRef } from 'react';

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

  return (
    <div ref={ref} style={{
      position: 'fixed', left: x, top: y, zIndex: 9999,
      background: 'var(--input-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: 'var(--gap-xs) 0',
      minWidth: 140, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font)', fontSize: 'var(--fs-sm)',
    }}>
      {items.map((item, i) => (
        <button key={i} style={{
          background: 'none', border: 'none', color: item.danger ? 'var(--red)' : 'var(--text-dim)',
          cursor: 'pointer', padding: 'var(--gap-sm) var(--gap-lg)',
          textAlign: 'left', fontSize: 'var(--fs)', fontWeight: item.danger ? 700 : 400,
        }} onClick={() => { item.action(); onClose(); }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--border-light)'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'none'; }}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
