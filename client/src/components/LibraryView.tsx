import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { LibraryAlbum } from '../api';

interface LibraryViewProps {
  entries: LibraryAlbum[];
  cardSize: number;
  minAlbums: number;
}

interface BandGroup {
  bandId: number;
  bandName: string;
  albums: LibraryAlbum[];
}

const BATCH_SIZE = 20;
const LOCALE = 'ru';

const compareNames = (a: string, b: string) => a.localeCompare(b, LOCALE, { numeric: true, sensitivity: 'base' });

function firstLetter(name: string): string {
  return (name[0] ?? '').toUpperCase();
}

export function LibraryView({ entries, cardSize, minAlbums }: LibraryViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bandSectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingScroll = useRef<string | null>(null);

  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const genreCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      if (!e.genre) continue;
      for (const g of e.genre.split(',').map(s => s.trim()).filter(Boolean)) {
        counts.set(g, (counts.get(g) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

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
    const result: BandGroup[] = [];
    for (const group of map.values()) {
      if (group.albums.length < minAlbums) continue;
      if (selectedGenre) {
        const hasGenre = group.albums.some(a =>
          a.genre?.split(',').map(s => s.trim()).includes(selectedGenre)
        );
        if (!hasGenre) continue;
      }
      group.albums.sort((a, b) => (a.year ?? '9999').localeCompare(b.year ?? '9999'));
      result.push(group);
    }
    return result.sort((a, b) => compareNames(a.bandName, b.bandName));
  }, [entries, minAlbums, selectedGenre]);

  const totalOwned = entries.filter(e => e.inLibrary).length;
  const visibleBands = bands.slice(0, visibleCount);

  const alphaLetters = useMemo(() => {
    const seen = new Set<string>();
    for (const b of bands) {
      seen.add(firstLetter(b.bandName));
    }
    return [...seen].sort((a, b) => compareNames(a, b));
  }, [bands]);

  const letterFirstIndex = useMemo(() => {
    const map = new Map<string, number>();
    let last = '';
    for (let i = 0; i < bands.length; i++) {
      const l = firstLetter(bands[i].bandName);
      if (l !== last) {
        map.set(l, i);
        last = l;
      }
    }
    return map;
  }, [bands]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        setVisibleCount(prev => Math.min(prev + BATCH_SIZE, bands.length));
      }
      let current = '';
      for (const [letter, ref] of bandSectionRefs.current) {
        if (ref && ref.offsetTop - el.offsetTop <= scrollTop + 60) {
          current = letter;
        }
      }
      if (current) setActiveLetter(current);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [bands.length]);

  useEffect(() => {
    if (!pendingScroll.current) return;
    const letter = pendingScroll.current;
    pendingScroll.current = null;
    const ref = bandSectionRefs.current.get(letter);
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [visibleCount]);

  const scrollToLetter = useCallback((letter: string) => {
    const idx = letterFirstIndex.get(letter);
    if (idx === undefined) return;
    if (idx >= visibleCount) {
      setVisibleCount(Math.min(idx + BATCH_SIZE * 2, bands.length));
      pendingScroll.current = letter;
    } else {
      const ref = bandSectionRefs.current.get(letter);
      if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [letterFirstIndex, visibleCount, bands.length]);

  if (entries.length === 0) {
    return (
      <div className="library-empty">
        <p>Library is empty</p>
        <p className="library-empty-hint">Tag an album from DGC to start building your library</p>
      </div>
    );
  }

  return (
    <div className="library-layout">
      <nav className="library-alpha">
        {alphaLetters.map(letter => (
          <button
            key={letter}
            className={`library-alpha-letter${activeLetter === letter ? ' active' : ''}`}
            onClick={() => scrollToLetter(letter)}
          >
            {letter}
          </button>
        ))}
      </nav>

      <div ref={scrollRef} className="library-scroll" style={{ '--card-size': `${cardSize}px` } as React.CSSProperties}>
        <div className="library-stats">
          LIBRARY — {bands.length} bands, {entries.length} albums ({totalOwned} owned)
        </div>

        {genreCounts.length > 0 && (
          <div className="genre-cloud">
            {genreCounts.map(([genre, count]) => {
              const maxCount = genreCounts[0][1];
              const ratio = count / maxCount;
              const size = 11 + ratio * 11;
              const opacity = 0.45 + ratio * 0.55;
              return (
                <span
                  key={genre}
                  className={`genre-tag${selectedGenre === genre ? ' selected' : ''}`}
                  style={{ fontSize: `${size}px`, opacity }}
                  onClick={() => setSelectedGenre(prev => prev === genre ? null : genre)}
                >
                  {genre}
                  <span className="genre-tag-count">{count}</span>
                </span>
              );
            })}
          </div>
        )}

        {selectedGenre && (
          <div className="genre-filter-bar">
            <span>Filtered by: <strong>{selectedGenre}</strong></span>
            <button className="genre-filter-clear" onClick={() => setSelectedGenre(null)}>×</button>
          </div>
        )}

        {visibleBands.map((group, i) => {
          const owned = group.albums.filter(a => a.inLibrary).length;
          const letter = firstLetter(group.bandName);
          const prevGroup = visibleBands[i - 1];
          const showAnchor = !prevGroup || firstLetter(prevGroup.bandName) !== letter;
          return (
            <div
              key={group.bandId}
              ref={(el) => { if (el && showAnchor) bandSectionRefs.current.set(letter, el); }}
              className="library-band"
            >
              <div className="library-band-header">
                <span className="library-band-name">{group.bandName}</span>
                <span className="library-band-count">{owned}/{group.albums.length}</span>
              </div>

              <div className="library-albums-grid">
                {group.albums.map(album => (
                  <div
                    key={album.postId}
                    className={`library-card${album.inLibrary ? ' owned' : ''}`}
                  >
                    <div className="library-card-cover">
                      {album.coverUrl ? (
                        <img
                          src={`/api/cover/${album.bandId}/${album.postId}`}
                          alt=""
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).classList.add('img-error'); }}
                        />
                      ) : (
                        <span className="library-cover-placeholder">?</span>
                      )}
                      <div className={`library-card-status${album.inLibrary ? ' owned' : ''}`}>✓</div>
                    </div>
                    <div className="library-card-info">
                      <div className="library-card-title text-ellipsis">{album.album}</div>
                      <div className="library-card-meta">
                        <span>{album.year || '—'}</span>
                        {album.genre && <span>{album.genre}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
