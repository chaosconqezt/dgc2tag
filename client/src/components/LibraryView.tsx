import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { LibraryAlbum } from '../api';

interface LibraryViewProps {
  entries: LibraryAlbum[];
}

interface BandGroup {
  bandId: number;
  bandName: string;
  albums: LibraryAlbum[];
}

const BATCH_SIZE = 20;

export function LibraryView({ entries }: LibraryViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const bandRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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
    for (const group of map.values()) {
      group.albums.sort((a, b) => (a.year ?? '9999').localeCompare(b.year ?? '9999'));
    }
    return [...map.values()].sort((a, b) => a.bandName.localeCompare(b.bandName));
  }, [entries]);

  const totalOwned = entries.filter(e => e.inLibrary).length;
  const visibleBands = bands.slice(0, visibleCount);

  const alphaLetters = useMemo(() => {
    const letters = new Set<string>();
    for (const b of bands) {
      const c = b.bandName[0]?.toUpperCase();
      if (c) letters.add(c);
    }
    return [...letters].sort();
  }, [bands]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        setVisibleCount(prev => Math.min(prev + BATCH_SIZE, bands.length));
      }
      let current = '';
      for (const [letter, ref] of bandRefs.current) {
        if (ref && ref.offsetTop - el.offsetTop <= scrollTop + 100) {
          current = letter;
        }
      }
      setActiveLetter(current || null);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [bands.length]);

  const scrollToLetter = useCallback((letter: string) => {
    const ref = bandRefs.current.get(letter);
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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

      <div ref={scrollRef} className="library-scroll">
        <div className="library-stats">
          LIBRARY — {bands.length} bands, {entries.length} albums ({totalOwned} owned)
        </div>

        {visibleBands.map(group => {
          const owned = group.albums.filter(a => a.inLibrary).length;
          const letter = group.bandName[0]?.toUpperCase() || '';
          const prevLetter = visibleBands[visibleBands.indexOf(group) - 1]?.bandName[0]?.toUpperCase() || '';
          const showAnchor = letter !== prevLetter;
          return (
            <div
              key={group.bandId}
              ref={(el) => { if (el && showAnchor) bandRefs.current.set(letter, el); }}
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
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
