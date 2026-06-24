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
