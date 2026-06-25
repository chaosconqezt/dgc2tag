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
    files?: string[];
    trackTitles?: Record<string, string>;
    trackArtists?: Record<string, string>;
    trackDurations?: Record<string, number>;
    postId?: number | null;
    deezerId?: number | null;
    artists?: string[];
    albumArtists?: string[];
    extraTags?: Record<string, string>;
}

export interface Id3Tags {
    artist?: string;
    album?: string;
    albumArtist?: string;
    genre?: string;
    year?: string;
    track?: number;
    trackNumber?: string | number;
    title?: string;
    length?: number | string;
    bitrate?: number;
    audioFormat?: string;
    notes?: string;
    publisher?: string;
    performerInfo?: string;
    userDefinedText?: { description?: string; value?: string; key?: string }[];
    recordingTime?: string;
    TLEN?: string;
    _buffer?: unknown;
    [key: string]: unknown;
}
