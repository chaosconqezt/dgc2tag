import axios from 'axios';
import { logger } from './logger.js';

const MB_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'DGCTagger/1.0 ( https://github.com/dgc-tagger )';

export interface MusicBrainzResult {
  source: 'musicbrainz';
  id: string;
  releaseId: string;
  title: string;
  artist: string;
  artistId: string | null;
  releaseGroupId: string | null;
  catalogNumber: string | null;
  discId: string | null;
  originalYear: string | null;
  year: string | null;
  label: string | null;
  releaseType: string | null;
  status: string | null;
  country: string | null;
  trackCount: number;
  tracks: { num: string; name: string; duration?: number; recordingId?: string }[];
  url: string;
  tags: string[];
  extraTags: Record<string, string>;
}

interface MbRelease {
  id: string;
  title: string;
  'artist-credit'?: { name: string }[];
  date?: string;
  'label-info'?: { label: { name: string } }[];
  'release-group'?: { 'primary-type'?: string; 'secondary-types'?: string[] };
  'track-count'?: number;
  tags?: { name: string }[];
  relations?: { type: string; url?: { resource: string } }[];
}

// ── Dynamic field extraction ──────────────────────────────────

const FIELD_MAP: Record<string, string> = {
  'id': 'MusicBrainz Album Id',
  'status': 'MusicBrainz Album Status',
  'date': 'originalyear',
  'country': 'MusicBrainz Album Release Country',
  'barcode': 'Barcode',
  'asin': 'ASIN',
  'quality': 'MusicBrainz Album Quality',
  'packaging': 'MusicBrainz Album Packaging',
  'disambiguation': 'MusicBrainz Album Disambiguation',
  'text-representation.language': 'Language',
  'text-representation.script': 'Script',
  'artist-credit.0.artist.id': 'MusicBrainz Artist Id',
  'artist-credit.0.artist.name': 'ARTISTS',
  'artist-credit.0.artist.sort-name': 'MusicBrainz Artist Sort Name',
  'artist-credit.0.artist.disambiguation': 'MusicBrainz Artist Disambiguation',
  'artist-credit.0.artist.country': 'MusicBrainz Artist Country',
  'artist-credit.0.artist.type': 'MusicBrainz Artist Type',
  'label-info.0.label.id': 'MusicBrainz Label Id',
  'label-info.0.label.name': 'MusicBrainz Label Name',
  'label-info.0.label.type': 'MusicBrainz Label Type',
  'label-info.0.catalog-number': 'CATALOGNUMBER',
  'release-group.id': 'MusicBrainz Release Group Id',
  'release-group.title': 'MusicBrainz Release Group Title',
  'release-group.primary-type': 'MusicBrainz Release Group Type',
  'release-group.disambiguation': 'MusicBrainz Release Group Disambiguation',
  'release-group.first-release-date': 'MusicBrainz Release Group First Release Date',
  'media.0.format': 'MusicBrainz Medium Format',
};

function getByPath(obj: any, path: string): any {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    const idx = parseInt(p, 10);
    cur = isNaN(idx) ? cur[p] : cur[idx];
  }
  return cur;
}

function extractExtraTags(data: any, tracks: { num: string; recordingId?: string }[]): Record<string, string> {
  const tags: Record<string, string> = {};

  // Map known fields
  for (const [jsonPath, tagName] of Object.entries(FIELD_MAP)) {
    const val = getByPath(data, jsonPath);
    if (val != null && val !== '' && typeof val === 'string') {
      tags[tagName] = val;
    }
  }

  // Per-track recording IDs
  for (const track of tracks) {
    if (track.recordingId) {
      tags[`MusicBrainz Release Track Id ${track.num}`] = track.recordingId;
    }
  }

  // Disc IDs
  const discs = data.media?.[0]?.discs || [];
  for (let i = 0; i < discs.length; i++) {
    if (discs[i]?.id) tags[`MusicBrainz Disc Id ${i + 1}`] = discs[i].id;
    if (discs[i]?.sectors) tags[`MusicBrainz Disc Sectors ${i + 1}`] = String(discs[i].sectors);
  }

  // Release-group genres
  const rgGenres = data['release-group']?.genres || [];
  if (rgGenres.length > 0) {
    tags['MusicBrainz Release Group Genres'] = rgGenres.map((g: any) => g.name).join(', ');
  }

  return tags;
}

// ── API ───────────────────────────────────────────────────────

export async function searchMusicBrainz(artist?: string, album?: string): Promise<MusicBrainzResult[]> {
  const parts: string[] = [];
  if (artist) parts.push(`artist:"${artist}"`);
  if (album) parts.push(`release:"${album}"`);
  const query = parts.join(' AND ');
  if (!query) return [];

  logger.info(`musicbrainz search: "${query}"`);

  try {
    const { data } = await axios.get(`${MB_BASE}/release`, {
      params: { query, fmt: 'json', limit: 10 },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000,
    });

    if (!data?.releases?.length) {
      logger.info('musicbrainz: 0 results');
      return [];
    }

    const results: MusicBrainzResult[] = [];
    for (const rel of data.releases as MbRelease[]) {
      const artistName = rel['artist-credit']?.map(a => a.name).join(' / ') || '';
      const year = rel.date?.substring(0, 4) || null;
      const label = rel['label-info']?.[0]?.label?.name || null;
      const primaryType = rel['release-group']?.['primary-type'] || null;
      const secondaryTypes = rel['release-group']?.['secondary-types'] || [];
      const releaseType = primaryType === 'Other' && secondaryTypes.length > 0
        ? secondaryTypes[0]
        : primaryType;
      const tags = (rel.tags || []).map(t => t.name);
      const mbUrl = rel.relations?.find(r => r.type === 'musicbrainz' && r.url)?.url?.resource
        || `https://musicbrainz.org/release/${rel.id}`;

      const extraTags = extractExtraTags(rel, []);

      results.push({
        source: 'musicbrainz',
        id: rel.id,
        releaseId: rel.id,
        title: rel.title,
        artist: artistName,
        artistId: (rel as any)['artist-credit']?.[0]?.artist?.id || null,
        releaseGroupId: (rel as any)['release-group']?.id || null,
        catalogNumber: (rel as any)['label-info']?.[0]?.['catalog-number'] || null,
        discId: null,
        originalYear: rel.date || null,
        year,
        label,
        releaseType: releaseType || null,
        status: (rel as any).status || null,
        country: (rel as any).country || null,
        trackCount: rel['track-count'] || 0,
        tracks: [],
        url: mbUrl,
        tags,
        extraTags,
      });
    }

    logger.info(`musicbrainz: ${results.length} results`);
    return results;
  } catch (err) {
    logger.error(`musicbrainz search error: ${(err as Error).message}`);
    return [];
  }
}

export async function getMusicBrainzRelease(releaseId: string): Promise<MusicBrainzResult | null> {
  logger.info(`musicbrainz getRelease(${releaseId})`);

  try {
    const { data } = await axios.get(`${MB_BASE}/release/${releaseId}`, {
      params: { inc: 'recordings+artist-credits+labels+discids+release-groups', fmt: 'json' },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000,
    });

    if (!data) return null;

    const artistName = data['artist-credit']?.map((a: any) => a.name).join(' / ') || '';
    const artistId = data['artist-credit']?.[0]?.artist?.id || null;
    const year = data.date?.substring(0, 4) || null;
    const originalYear = data.date || null;
    const label = data['label-info']?.[0]?.label?.name || null;
    const catalogNumber = data['label-info']?.[0]?.['catalog-number'] || null;
    const releaseGroupId = data['release-group']?.id || null;
    const primaryType = data['release-group']?.['primary-type'] || null;
    const secondaryTypes = data['release-group']?.['secondary-types'] || [];
    const releaseType = primaryType === 'Other' && secondaryTypes.length > 0
      ? secondaryTypes[0]
      : primaryType;
    const status = data.status || null;
    const country = data.country || null;
    const tags = (data.tags || []).map((t: any) => t.name);

    const tracks = (data.media?.[0]?.tracks || []).map((t: any, i: number) => ({
      num: String(t.position || i + 1),
      name: t.title,
      duration: t.length ? Math.round(t.length / 1000) : undefined,
      recordingId: t.recording?.id || undefined,
    }));

    const extraTags = extractExtraTags(data, tracks);

    return {
      source: 'musicbrainz',
      id: data.id,
      releaseId: data.id,
      title: data.title,
      artist: artistName,
      artistId,
      releaseGroupId,
      catalogNumber,
      discId: data.media?.[0]?.discs?.[0]?.id || null,
      originalYear,
      year,
      label,
      releaseType,
      status,
      country,
      trackCount: tracks.length,
      tracks,
      url: `https://musicbrainz.org/release/${data.id}`,
      tags,
      extraTags,
    };
  } catch (err) {
    logger.error(`musicbrainz getRelease error: ${(err as Error).message}`);
    return null;
  }
}
