import { useMemo } from 'react';
import { FONT, FS, COLORS } from './styles';
import type { LibraryAlbum } from '../api';

interface LibraryViewProps {
  entries: LibraryAlbum[];
}

interface BandGroup {
  bandId: number;
  bandName: string;
  albums: LibraryAlbum[];
}

export function LibraryView({ entries }: LibraryViewProps) {
  const bands = useMemo(() => {
    const map = new Map<number, BandGroup>();
    for (const e of entries) {
      let group = map.get(e.bandId);
      if (!group) {
        group = { bandId: e.bandId, bandName: e.bandName || e.artist, albums: [] };
        map.set(e.bandId, group);
      }
      group.albums.push(e);
    }
    // Sort albums within each band by year
    for (const group of map.values()) {
      group.albums.sort((a, b) => (a.year ?? '9999').localeCompare(b.year ?? '9999'));
    }
    // Sort bands by name
    return [...map.values()].sort((a, b) => a.bandName.localeCompare(b.bandName));
  }, [entries]);

  const totalOwned = entries.filter(e => e.inLibrary).length;

  if (entries.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: COLORS.textInvisible }}>
        <p style={{ fontSize: FS, fontFamily: FONT }}>Library is empty</p>
        <p style={{ fontSize: '11px', fontFamily: FONT, marginTop: '4px' }}>Tag an album from DGC to start building your library</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
      <div style={{ marginBottom: '16px', fontSize: FS, fontFamily: FONT, color: COLORS.textMuted }}>
        LIBRARY — {bands.length} bands, {entries.length} albums ({totalOwned} owned)
      </div>

      {bands.map(group => {
        const owned = group.albums.filter(a => a.inLibrary).length;
        return (
          <div key={group.bandId} style={{ marginBottom: '20px' }}>
            {/* Band header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 10px', marginBottom: '4px',
              backgroundColor: COLORS.inputBgAlt, borderRadius: '6px',
              border: `1px solid ${COLORS.border}`,
            }}>
              <span style={{ fontSize: FS, fontWeight: '700', fontFamily: FONT, color: COLORS.text }}>
                {group.bandName}
              </span>
              <span style={{ fontSize: '11px', fontFamily: FONT, color: COLORS.textDim }}>
                {owned}/{group.albums.length}
              </span>
            </div>

            {/* Albums */}
            {group.albums.map(album => (
              <div
                key={album.postId}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '4px 10px 4px 24px',
                  borderLeft: `2px solid ${album.inLibrary ? COLORS.green : COLORS.textInvisible}`,
                  opacity: album.inLibrary ? 1 : 0.6,
                }}
              >
                {/* Cover thumbnail */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '3px',
                  overflow: 'hidden', backgroundColor: COLORS.inputBg,
                  border: `1px solid ${album.inLibrary ? COLORS.green : COLORS.border}`,
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {album.coverUrl ? (
                    <img
                      src={`/api/cover/${album.bandId}/${album.postId}`}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span style={{ fontSize: '10px', color: COLORS.textInvisible }}>?</span>
                  )}
                </div>

                {/* Album info */}
                <span style={{
                  fontSize: FS, fontFamily: FONT,
                  color: album.inLibrary ? COLORS.text : COLORS.textDim,
                  fontWeight: album.inLibrary ? '600' : '400',
                }}>
                  {album.album}
                </span>
                <span style={{ fontSize: '11px', fontFamily: FONT, color: COLORS.textFaint }}>
                  {album.year || '—'}
                </span>
                {album.genre && (
                  <span style={{ fontSize: '11px', fontFamily: FONT, color: COLORS.textInvisible }}>
                    {album.genre}
                  </span>
                )}

                {/* Status indicator */}
                <span style={{ marginLeft: 'auto', fontSize: '11px', fontFamily: FONT, color: album.inLibrary ? COLORS.green : COLORS.textInvisible }}>
                  {album.inLibrary ? '✓' : '—'}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
