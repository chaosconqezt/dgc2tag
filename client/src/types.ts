export interface FileNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  children?: FileNode[];
  hasAudioFiles?: boolean;
}

export interface AlbumTags {
  artist?: string;
  albumArtist?: string;
  album?: string;
  year?: string;
  genre?: string;
  country?: string;
  label?: string;
  releaseType?: string;
  trackCount?: number;
  // ALL keys = FULL FILE PATHS (immutable identifiers)
  files?: string[];          // full paths: c:/music/album/01.mp3
  trackTitles?: Record<string, string>;  // filePath → title
  trackArtists?: Record<string, string>; // filePath → artist
  trackDurations?: Record<string, number | undefined>;
  postId?: number;
  bandId?: number;
  deezerId?: number;
  artists?: string[];
  albumArtists?: string[];
  extraTags?: Record<string, string>;
  bitrateInfo?: string;
}

export interface SearchResult {
  source: 'dgc' | 'deezer' | 'musicbrainz' | string;
  id: string;
  postId: number;
  bandId?: number | null;
  albumName: string | null;
  artist: string;
  albumArtist: string;
  coverUrl: string | null;
  country: string | null;
  year: string | null;
  label: string | null;
  genres: string[];
  genreIds?: number[];
  releaseType: string | null;
  typeId?: number | null;
  url: string;
  tracklist?: string;
  notes?: string;
  youtube?: string;
  metalArchivesUrl?: string;
  artworkBy?: string;
  compilation?: boolean;
  parsedTracks?: { num: string; artist: string; name: string; duration?: number }[];
  trackCount?: number;
  // MusicBrainz fields
  musicbrainzReleaseId?: string;
  musicbrainzArtistId?: string;
  musicbrainzAlbumArtistId?: string;
  musicbrainzReleaseGroupId?: string;
  musicbrainzReleaseTrackIds?: string[];
  catalogNumber?: string;
  discId?: string;
  originalYear?: string;
  extraTags?: Record<string, string>;
}

export interface MatchResult {
  remote: { num: string; artist: string; name: string; duration?: number };
  local: { num: string; name: string; file: string; artist?: string } | null;
  sim: number;
  numberMismatch: boolean;
}



export interface DeezerSearchResult {
  source: 'deezer';
  id: string;
  albumId: number;
  albumName: string;
  artist: string;
  year: string | null;
  label: string | null;
  releaseType: string | null;
  compilation?: boolean;
  coverUrl: string;
  trackCount: number;
  tracks: { num: string; name: string; duration: number; artist?: string }[];
  url: string;
}
