import { Check, Globe, ExternalLink, ArrowRightLeft, FileEdit } from 'lucide-react';
import type { SearchResult, AlbumTags } from '../types';
import { FONT, FS } from './styles';

interface ApplyPanelProps {
  selectedResult: SearchResult | null;
  localTags?: AlbumTags | null;
  onApplyTags: (mode: 'write' | 'rename' | 'move') => void;
}

const btnBase = {
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  gap: '5px',
  flex: 1,
  height: '32px',
  padding: '0 7px',
  fontSize: FS,
  fontWeight: '700' as const,
  letterSpacing: '0.3px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer' as const,
  fontFamily: FONT,
};

export function ApplyPanel({ selectedResult, onApplyTags }: ApplyPanelProps) {
  return (
    <div style={{ padding: '10px', background: '#111114', borderRadius: '8px', border: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: '6px', fontSize: FS, fontFamily: FONT }}>
      <button
        onClick={() => onApplyTags('move')}
        title="Write tags, rename files, and move to output folder"
        style={{ ...btnBase, background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', boxShadow: '0 1px 6px rgba(37, 99, 243, 0.3)' }}
      >
        <ArrowRightLeft size={11} /> WRITE & MOVE
      </button>
      <button
        onClick={() => onApplyTags('rename')}
        title="Write tags and rename files to 'Track. Artist - Title.ext'"
        style={{ ...btnBase, background: 'linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)', color: '#fff', boxShadow: '0 1px 6px rgba(167, 139, 250, 0.3)' }}
      >
        <FileEdit size={11} /> WRITE & RENAME
      </button>
      <button
        onClick={() => onApplyTags('write')}
        title="Write tags only, do not rename or move files"
        className="btn-primary"
        style={{ ...btnBase, background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)', color: '#fff', boxShadow: '0 1px 6px rgba(239, 68, 68, 0.3)' }}
      >
        <Check size={11} /> WRITE
      </button>
      {selectedResult?.url && (
        <div style={{ flex: 1 }} />
      )}
      {selectedResult?.url && (
        <a href={selectedResult.url} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#ef4444', textDecoration: 'none', fontWeight: '600' }}>
          <Globe size={9} /> DGC <ExternalLink size={8} />
        </a>
      )}
      {selectedResult?.metalArchivesUrl && (
        <a href={selectedResult.metalArchivesUrl} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#71717a', textDecoration: 'none' }}>
          <ExternalLink size={9} /> MA
        </a>
      )}
      {selectedResult?.artworkBy && <span style={{ color: '#52525b' }}>Artwork: {selectedResult.artworkBy}</span>}
    </div>
  );
}
