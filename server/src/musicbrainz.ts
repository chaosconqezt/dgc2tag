import axios from 'axios';
import { logger } from './logger.js';

const MB_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'DGCTagger/1.0 ( https://github.com/dgc-tagger )';

export interface MusicBrainzResult {
  source: 'musicbrainz';
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

interface MbReleaseDetail extends MbRelease {
  tracks?: {
    'track-list'?: { number: string; title: string; length?: number }[];
  };
}

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

      results.push({
        source: 'musicbrainz',
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
        status: null,
        country: (rel as any).country || null,
        trackCount: rel['track-count'] || 0,
        tracks: [],
        url: mbUrl,
        tags,
        extraTags: {
          ...(rel.id ? { 'MusicBrainz Album Id': rel.id } : {}),
          ...((rel as any)['artist-credit']?.[0]?.artist?.id ? { 'MusicBrainz Artist Id': (rel as any)['artist-credit'][0].artist.id } : {}),
          ...((rel as any)['release-group']?.id ? { 'MusicBrainz Release Group Id': (rel as any)['release-group'].id } : {}),
          ...((rel as any)['label-info']?.[0]?.['catalog-number'] ? { 'CATALOGNUMBER': (rel as any)['label-info'][0]['catalog-number'] } : {}),
          ...(rel.date ? { 'originalyear': rel.date } : {}),
          ...((rel as any).country ? { 'MusicBrainz Album Release Country': (rel as any).country } : {}),
        },
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
      params: { inc: 'recordings', fmt: 'json' },
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
    const discId = data['id-discid'] || data.discs?.[0]?.id || null;

    const tracks = (data.media?.[0]?.tracks || []).map((t: any, i: number) => ({
      num: String(t.position || i + 1),
      name: t.title,
      duration: t.length ? Math.round(t.length / 1000) : undefined,
      recordingId: t.recording?.id || undefined,
    }));

    // Collect ALL extra tags from MB
    const extraTags: Record<string, string> = {};
    if (data.id) extraTags['MusicBrainz Album Id'] = data.id;
    if (artistId) extraTags['MusicBrainz Artist Id'] = artistId;
    if (data['artist-credit']?.[0]?.artist?.name) extraTags['ARTISTS'] = data['artist-credit'][0].artist.name;
    if (releaseGroupId) extraTags['MusicBrainz Release Group Id'] = releaseGroupId;
    if (catalogNumber) extraTags['CATALOGNUMBER'] = catalogNumber;
    if (discId) extraTags['DISCID'] = discId;
    if (originalYear) extraTags['originalyear'] = originalYear;
    if (status) extraTags['MusicBrainz Album Status'] = status;
    if (country) extraTags['MusicBrainz Album Release Country'] = country;
    if (data['release-group']?.['primary-type']) extraTags['MusicBrainz Release Group Type'] = data['release-group']['primary-type'];
    if (data.barcode) extraTags['Barcode'] = data.barcode;
    if (data.asin) extraTags['ASIN'] = data.asin;
    if (data['text-representation']?.language) extraTags['Language'] = data['text-representation'].language;
    if (data['text-representation']?.script) extraTags['Script'] = data['text-representation'].script;
    if (data.quality) extraTags['Quality'] = data.quality;
    for (const track of tracks) {
      if (track.recordingId) extraTags[`MusicBrainz Release Track Id ${track.num}`] = track.recordingId;
    }

    return {
      source: 'musicbrainz',
      releaseId: data.id,
      title: data.title,
      artist: artistName,
      artistId,
      releaseGroupId,
      catalogNumber,
      discId,
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
