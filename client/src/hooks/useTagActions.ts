import type { AlbumTags, SearchResult } from '../types';
import type { MusicBrainzSearchResult } from '../api';
import * as api from '../api';
import { matchTracks, stripParentheses, generateParsedTracks } from '../utils';

export type ApplyMode = 'write' | 'rename' | 'move';

export interface AppState {
  selectedFolder: string | null;
  selectedResult: SearchResult | null;
  localTags: import('../types').AlbumTags | null;
  albumDetails: SearchResult | null;
  tagEnabled: Record<string, boolean>;
  editedSiteValues: Record<string, string>;
  editedTrackNames: Record<string, string>;
  editedTrackArtists: Record<string, string>;
  writeTrackNames: boolean;
  stripRemoteParentheses: boolean;
  configOutputFolder: string;
}

export type AppDispatch = React.Dispatch<{
  type: string;
  payload?: unknown;
}>;

export function createApplyTags(
  state: AppState,
  dispatch: AppDispatch,
  clearSelectionState: () => void,
  fetchLibrary: () => Promise<void>,
) {
  return async (mode: ApplyMode = 'write') => {
    if (!state.selectedFolder || (!state.selectedResult && !state.localTags)) return;

    const sr = state.selectedResult;
    const tagsToApply: Record<string, string> = {};
    const applyStrip = (v: string): string => state.stripRemoteParentheses ? stripParentheses(v) : v;

    const srcArtist = sr ? applyStrip(sr.artist) : (state.localTags?.artists?.[0] || state.localTags?.artist || '');
    const srcAlbumArtist = sr ? applyStrip(sr.albumArtist) : (state.localTags?.albumArtist || state.localTags?.artist || '');
    const finalArtist = state.editedSiteValues.artist !== undefined ? applyStrip(state.editedSiteValues.artist) : srcArtist;
    const finalAlbumArtist = state.editedSiteValues.albumArtist !== undefined ? applyStrip(state.editedSiteValues.albumArtist) : srcAlbumArtist;

    if (state.tagEnabled.artist !== false) tagsToApply.artist = finalArtist;
    if (state.tagEnabled.albumArtist !== false) tagsToApply.albumArtist = finalAlbumArtist;
    if (state.tagEnabled.album !== false) tagsToApply.album = state.editedSiteValues.album ?? sr?.albumName ?? state.localTags?.album;
    if (state.tagEnabled.year !== false) tagsToApply.year = state.editedSiteValues.year ?? sr?.year ?? state.localTags?.year;
    if (state.tagEnabled.genre !== false) tagsToApply.genre = state.editedSiteValues.genre ?? sr?.genres?.join(', ') ?? state.localTags?.genre;
    if (state.tagEnabled.country !== false) {
      const val = state.editedSiteValues.country ?? sr?.country;
      tagsToApply.country = val ?? state.localTags?.country;
    }
    if (state.tagEnabled.label !== false) {
      const val = state.editedSiteValues.label ?? sr?.label;
      tagsToApply.label = val ?? state.localTags?.label;
    }
    if (state.tagEnabled.releaseType !== false) {
      const val = state.editedSiteValues.releaseType ?? sr?.releaseType;
      tagsToApply.releaseType = val ?? state.localTags?.releaseType;
    }
    if (sr && state.tagEnabled.postId !== false) {
      if (sr.postId > 0) {
        tagsToApply.postId = state.editedSiteValues.postId ?? String(sr.postId);
      } else if (state.localTags?.postId != null) {
        tagsToApply.postId = String(state.localTags.postId);
      }
    } else if (state.localTags?.postId != null) {
      tagsToApply.postId = String(state.localTags.postId);
    }
    if (sr && state.tagEnabled.deezerId !== false) {
      if (sr.postId < 0) {
        tagsToApply.deezerId = state.editedSiteValues.deezerId ?? String(Math.abs(sr.postId));
      } else if (state.localTags?.deezerId != null) {
        tagsToApply.deezerId = String(state.localTags.deezerId);
      }
    } else if (state.localTags?.deezerId != null) {
      tagsToApply.deezerId = String(state.localTags.deezerId);
    }

    if (sr?.musicbrainzReleaseId) tagsToApply.musicbrainzReleaseId = sr.musicbrainzReleaseId;
    if (sr?.musicbrainzArtistId) tagsToApply.musicbrainzArtistId = sr.musicbrainzArtistId;
    if (sr?.musicbrainzAlbumArtistId) tagsToApply.musicbrainzAlbumArtistId = sr.musicbrainzAlbumArtistId;
    if (sr?.musicbrainzReleaseGroupId) tagsToApply.musicbrainzReleaseGroupId = sr.musicbrainzReleaseGroupId;
    if (sr?.catalogNumber) tagsToApply.catalogNumber = sr.catalogNumber;
    if (sr?.discId) tagsToApply.discId = sr.discId;
    if (sr?.originalYear) tagsToApply.originalYear = sr.originalYear;

    const parsedTracks = generateParsedTracks(state.albumDetails, state.localTags);

    const matched = parsedTracks && state.localTags?.files
      ? matchTracks(parsedTracks, state.localTags.files, state.localTags.trackTitles, false, 'id3')
      : [];

    const trackArtists: Record<string, string> | undefined = matched.filter(m => m.local).length > 0
      ? Object.fromEntries(
          matched.filter(m => m.local).map(m => [m.local!.file, applyStrip(state.editedTrackArtists[m.remote.num] ?? m.remote.artist)])
        )
      : undefined;

    const trackNames: Record<string, string> | undefined = (state.writeTrackNames || mode !== 'write') && matched.filter(m => m.local).length > 0
      ? Object.fromEntries(
          matched.filter(m => m.local).map(m => [m.local!.file, applyStrip(state.editedTrackNames[m.remote.num] ?? m.remote.name)])
        )
      : undefined;

    try {
      const result = await api.updateTags({
        folderPath: state.selectedFolder,
        tags: tagsToApply as AlbumTags,
        trackArtists,
        trackNames,
        moveFiles: mode === 'move',
        renameFiles: mode === 'rename' || mode === 'move',
      });

      if (mode === 'move' && result.moved?.length) {
        const details: string[] = [...(result.tagChanges || [])];
        if (result.renamed?.length) {
          details.push('');
          details.push('Renamed files:');
          for (const r of result.renamed) details.push(`  ${r.from} → ${r.to}`);
        }
        if (result.moved.length) {
          details.push('');
          details.push(`Moved to ${state.configOutputFolder}/:`);
          for (const f of result.moved) details.push(`  ${f}`);
        }
        dispatch({ type: 'SET_RESULT_MODAL', payload: { success: true, message: `${result.moved.length} files moved`, details } });
        clearSelectionState();
        await fetchLibrary();
      } else if (mode === 'rename' && result.renamed?.length) {
        const details: string[] = [...(result.tagChanges || [])];
        details.push('');
        details.push('Renamed files:');
        for (const r of result.renamed) details.push(`  ${r.from} → ${r.to}`);
        dispatch({ type: 'SET_RESULT_MODAL', payload: { success: true, message: `${result.renamed.length} files renamed`, details } });
        const refreshedTags = await api.fetchTags(state.selectedFolder);
        dispatch({ type: 'SET_LOCAL_TAGS', payload: refreshedTags });
      } else {
        const details = result.tagChanges?.length ? result.tagChanges : undefined;
        dispatch({ type: 'SET_RESULT_MODAL', payload: { success: true, message: 'Tags updated successfully!', details } });
        const refreshedTags = await api.fetchTags(state.selectedFolder);
        dispatch({ type: 'SET_LOCAL_TAGS', payload: refreshedTags });
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[client] updateTags error:', err);
      dispatch({ type: 'SET_RESULT_MODAL', payload: { success: false, message: 'Failed to update tags', details: [String(err)] } });
    }
  };
}
