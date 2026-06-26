import { useEffect, useState } from 'react';
import { FONT, FS, COLORS, INPUT_STYLE } from './styles';

export function TrackArtistField({
  value,
  onChange,
  enabled,
}: {
  value: string;
  onChange: (v: string) => void;
  enabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: FS,
        fontFamily: FONT,
        color: enabled ? COLORS.textMuted : COLORS.textFaint,
        cursor: editing ? 'text' : 'pointer',
        padding: 0,
        borderRadius: 0,
        border: 'none',
        background: 'transparent',
        minWidth: '20px',
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft.trim() && draft !== value) {
              onChange(draft.trim());
            } else {
              setDraft(value);
            }
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (draft.trim() && draft !== value) {
                onChange(draft.trim());
              } else {
                setDraft(value);
              }
              setEditing(false);
            }
            if (e.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
          style={{
            ...INPUT_STYLE,
            background: 'transparent',
            border: 'none',
            color: COLORS.textMuted,
            padding: 0,
            width: '100%',
            minWidth: '30px',
          }}
        />
      ) : (
        <span
          className="text-ellipsis"
          onClick={() => { setDraft(value); setEditing(true); }}
          title={value}
          style={{
            display: 'block',
          }}
        >{value || '—'}</span>
      )}
    </div>
  );
}
