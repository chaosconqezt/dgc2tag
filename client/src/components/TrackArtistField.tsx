import { useEffect, useState } from 'react';

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
      className="track-artist-field"
      data-enabled={String(enabled)}
      style={{ cursor: editing ? 'text' : 'pointer' }}
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
        />
      ) : (
        <span
          className="text-ellipsis"
          onClick={() => { setDraft(value); setEditing(true); }}
          title={value}
          style={{ display: 'block' }}
        >{value || '—'}</span>
      )}
    </div>
  );
}
