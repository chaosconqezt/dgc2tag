import type { SearchResult, DeezerSearchResult } from '../types';
import type { MusicBrainzSearchResult, DiscogsSearchResult } from '../api';
import * as api from '../api';

export type AppDispatch = React.Dispatch<{ type: string; payload?: unknown }>;

export interface SearchRefs {
  searchInProgress: React.MutableRefObject<boolean>;
  loadAlbumDetailsId: React.MutableRefObject<number | string | null>;
  searchGeneration: React.MutableRefObject<number>;
}

export interface SearchState {
  searchArtist: string;
  searchAlbum: string;
  searchArtistEnabled: boolean;
  searchAlbumEnabled: boolean;
  selectedResult: SearchResult | null;
  selectedDeezer: DeezerSearchResult | null;
  tagEnabled: Record<string, boolean>;
  enabledSources: Record<string, boolean>;
}

export function createSearchActions(
  state: SearchState,
  dispatch: AppDispatch,
  clearSelectionState: () => void,
  refs: SearchRefs,
) {
  const { searchInProgress: searchInProgressRef, loadAlbumDetailsId: loadAlbumDetailsIdRef, searchGeneration } = refs;

  const loadAlbumDetails = async (postId: number) => {
    loadAlbumDetailsIdRef.current = postId;
    if (import.meta.env.DEV) console.log(`[client] loading album details: ${postId}`);
    try {
      const data = await api.fetchAlbumDetails(postId);
      if (loadAlbumDetailsIdRef.current !== postId) return;
      dispatch({ type: 'SET_ALBUM_DETAILS', payload: data });
    } catch (err) {
      if (loadAlbumDetailsIdRef.current !== postId) return;
      if (import.meta.env.DEV) console.error('[client] album details error:', err);
      dispatch({ type: 'SET_ALBUM_DETAILS', payload: null });
    }
  };

  return {
    handleSearch: async (artist?: string, album?: string, artistEnabled?: boolean, albumEnabled?: boolean) => {
      if (searchInProgressRef.current) return;

      const a = artistEnabled ?? state.searchArtistEnabled;
      const b = albumEnabled ?? state.searchAlbumEnabled;
      const usedArtist = artist ?? state.searchArtist;
      const usedAlbum = album ?? state.searchAlbum;
      const dgcQuery = [a ? usedArtist : '', b ? usedAlbum : ''].filter(Boolean).join(' ');
      if (!dgcQuery) return;

      searchInProgressRef.current = true;
      const gen = ++searchGeneration.current;

      if (import.meta.env.DEV) console.log(`[client] search DGC: "${dgcQuery}"`);
      dispatch({ type: 'SET_DGC_LOADING', payload: true });
      dispatch({ type: 'SET_DEEZER_LOADING', payload: true });
      dispatch({ type: 'SET_MBRAINZ_LOADING', payload: true });
      dispatch({ type: 'SET_DISCOGS_LOADING', payload: true });
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      dispatch({ type: 'SET_DEEZER_RESULTS', payload: [] });
      dispatch({ type: 'SET_MBRAINZ_RESULTS', payload: [] });
      dispatch({ type: 'SET_DISCOGS_RESULTS', payload: [] });
      dispatch({ type: 'SET_SEARCH_TIME', payload: null });

      const start = Date.now();
      const dzArtist = a ? usedArtist : undefined;
      const dzAlbum = b ? usedAlbum : undefined;
      const es = state.enabledSources;
      let totalSources = 0;
      let done = 0;
      const checkDone = () => { if (++done >= totalSources) { dispatch({ type: 'SET_SEARCH_TIME', payload: Date.now() - start }); searchInProgressRef.current = false; } };

      if (es.dgc !== false) {
        totalSources++;
        api.searchAlbums(dgcQuery)
          .then(data => { if (searchGeneration.current === gen) dispatch({ type: 'SET_SEARCH_RESULTS', payload: data }); })
          .catch(() => {})
          .finally(() => { dispatch({ type: 'SET_DGC_LOADING', payload: false }); checkDone(); });
      } else { dispatch({ type: 'SET_DGC_LOADING', payload: false }); }

      if (es.deezer !== false) {
        totalSources++;
        api.searchAlbumsDeezer(dzArtist, dzAlbum)
          .then(data => { if (searchGeneration.current === gen) dispatch({ type: 'SET_DEEZER_RESULTS', payload: data }); })
          .catch(() => {})
          .finally(() => { dispatch({ type: 'SET_DEEZER_LOADING', payload: false }); checkDone(); });
      } else { dispatch({ type: 'SET_DEEZER_LOADING', payload: false }); }

      if (es.mbrainz !== false) {
        totalSources++;
        api.searchAlbumsMusicBrainz(dzArtist, dzAlbum)
          .then(data => { if (searchGeneration.current === gen) dispatch({ type: 'SET_MBRAINZ_RESULTS', payload: data }); })
          .catch(() => {})
          .finally(() => { dispatch({ type: 'SET_MBRAINZ_LOADING', payload: false }); checkDone(); });
      } else { dispatch({ type: 'SET_MBRAINZ_LOADING', payload: false }); }

      if (es.discogs !== false) {
        totalSources++;
        api.searchAlbumsDiscogs(dzArtist, dzAlbum)
          .then(data => { if (searchGeneration.current === gen) dispatch({ type: 'SET_DISCOGS_RESULTS', payload: data }); })
          .catch(() => {})
          .finally(() => { dispatch({ type: 'SET_DISCOGS_LOADING', payload: false }); checkDone(); });
      } else { dispatch({ type: 'SET_DISCOGS_LOADING', payload: false }); }

      if (totalSources === 0) {
        dispatch({ type: 'SET_SEARCH_TIME', payload: Date.now() - start });
        searchInProgressRef.current = false;
      }
    },

    loadAlbumDetails,

    handleSelectResult: (res: SearchResult) => {
      if (state.selectedResult?.postId === res.postId) return;
      clearSelectionState();
      dispatch({ type: 'SET_SELECTED_RESULT', payload: res });
      dispatch({ type: 'SET_ALBUM_DETAILS', payload: null });
      loadAlbumDetails(res.postId);
    },

    handleSelectDeezer: (dz: DeezerSearchResult) => {
      if (state.selectedDeezer?.albumId === dz.albumId) return;
      clearSelectionState();
      dispatch({ type: 'SET_SELECTED_DEEZER', payload: dz });

      const parsedTracks = dz.tracks.map(t => ({
        num: t.num,
        artist: t.artist || dz.artist,
        name: t.name,
        duration: t.duration,
      }));

      const syntheticResult: SearchResult = {
        source: 'deezer',
        id: `deezer-${dz.albumId}`,
        postId: -dz.albumId,
        albumName: dz.albumName,
        artist: dz.artist,
        albumArtist: dz.artist,
        coverUrl: dz.coverUrl,
        country: null,
        year: dz.year,
        label: dz.label,
        genres: [],
        releaseType: dz.releaseType,
        compilation: dz.compilation,
        url: dz.url,
        parsedTracks,
      };

      dispatch({ type: 'SET_SELECTED_RESULT', payload: syntheticResult });
      dispatch({ type: 'SET_ALBUM_DETAILS', payload: syntheticResult });
      dispatch({ type: 'SET_TAG_ENABLED', payload: { ...state.tagEnabled, artist: true, album: true, year: true, label: true, postId: false } });
    },

    handleSelectMbrainz: async (mb: MusicBrainzSearchResult) => {
      clearSelectionState();

      const baseResult: SearchResult = {
        source: 'musicbrainz',
        id: mb.id,
        postId: 0,
        albumName: mb.title,
        artist: mb.artist,
        albumArtist: mb.artist,
        coverUrl: null,
        country: mb.country,
        year: mb.year,
        label: mb.label,
        genres: [],
        releaseType: mb.releaseType,
        url: mb.url,
        parsedTracks: [],
        musicbrainzReleaseId: mb.releaseId,
        musicbrainzArtistId: mb.artistId ?? undefined,
        musicbrainzReleaseGroupId: mb.releaseGroupId ?? undefined,
        catalogNumber: mb.catalogNumber ?? undefined,
        discId: mb.discId ?? undefined,
        originalYear: mb.originalYear ?? undefined,
        extraTags: mb.extraTags || {},
      };

      dispatch({ type: 'SET_SELECTED_RESULT', payload: baseResult });
      dispatch({ type: 'SET_SELECTED_MBRAINZ', payload: mb });
      dispatch({ type: 'SET_ALBUM_DETAILS', payload: baseResult });
      dispatch({ type: 'SET_TAG_ENABLED', payload: { ...state.tagEnabled, artist: true, album: true, year: true, label: true, postId: false } });

      try {
        refs.loadAlbumDetailsId.current = mb.releaseId;
        const fullRelease = await api.fetchMusicBrainzRelease(mb.releaseId);
        if (refs.loadAlbumDetailsId.current !== mb.releaseId) return;

        const parsedTracks = fullRelease.tracks.map(t => ({
          num: t.num,
          artist: t.artist || fullRelease.artist,
          name: t.name,
          duration: t.duration,
        }));

        const uniqueArtists = new Set(parsedTracks.map(t => t.artist).filter(Boolean));
        const compilation = uniqueArtists.size > 1;

        const fullResult: SearchResult = {
          ...baseResult,
          parsedTracks,
          compilation,
          musicbrainzReleaseTrackIds: fullRelease.tracks.map(t => t.recordingId).filter(Boolean) as string[],
        };

        dispatch({ type: 'SET_ALBUM_DETAILS', payload: fullResult });
      } catch (err) {
        if (import.meta.env.DEV) console.error('[client] mbrainz release error:', err);
      }
    },

    handleSelectDiscogs: async (dg: DiscogsSearchResult) => {
      clearSelectionState();

      const baseResult: SearchResult = {
        source: 'discogs',
        id: dg.id,
        postId: 0,
        albumName: dg.albumName,
        artist: dg.artist,
        albumArtist: dg.artist,
        coverUrl: dg.coverUrl,
        country: dg.country,
        year: dg.year,
        label: dg.label,
        genres: [...dg.genres, ...dg.styles],
        releaseType: dg.releaseType,
        url: dg.url,
        parsedTracks: [],
      };

      dispatch({ type: 'SET_SELECTED_DISCOGS', payload: dg });
      dispatch({ type: 'SET_SELECTED_RESULT', payload: baseResult });
      dispatch({ type: 'SET_ALBUM_DETAILS', payload: baseResult });
      dispatch({ type: 'SET_TAG_ENABLED', payload: { ...state.tagEnabled, artist: true, album: true, year: true, label: true, genre: true, postId: false } });

      try {
        const fullRelease = await api.fetchDiscogsRelease(dg.id);

        const parsedTracks = fullRelease.parsedTracks?.map(t => ({
          num: t.num,
          artist: t.artist || fullRelease.artist,
          name: t.name,
          duration: t.duration,
        })) || [];

        const fullResult: SearchResult = {
          ...baseResult,
          parsedTracks,
          genres: [...(fullRelease.genres || []), ...(fullRelease.styles || [])],
          releaseType: fullRelease.releaseType,
        };

        dispatch({ type: 'SET_ALBUM_DETAILS', payload: fullResult });
      } catch (err) {
        if (import.meta.env.DEV) console.error('[client] discogs release error:', err);
      }
    },
  };
}
