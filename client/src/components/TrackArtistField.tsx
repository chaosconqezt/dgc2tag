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

  if (editing) {
    return (
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
        className="track-artist-field-input"
      />
    );
  }

  return (
    <span
      className={`track-artist-field${enabled ? '' : ' dim'}`}
      onClick={() => { setDraft(value); setEditing(true); }}
      title={value}
    >{value || '\u2014'}</span>
  );
}
