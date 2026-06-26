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
  editedExtraTags: Record<string, string>;
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

export interface ProgressState {
  active: boolean;
  phase: string;
  current: number;
  total: number;
  log: string[];
  done: boolean;
  success: boolean;
  message: string;
  details?: string[];
}

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
      if (sr.source === 'deezer') {
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

    if (Object.keys(state.editedExtraTags).length > 0) {
      tagsToApply.extraTags = state.editedExtraTags;
    }

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

    // Show progress overlay
    dispatch({ type: 'SET_PROGRESS', payload: { active: true, phase: 'Starting...', current: 0, total: 0, log: [], done: false, success: false, message: '' } });

    const log: string[] = [];
    let phase = 'Starting...';
    let current = 0;
    let total = 0;

    const updateProgress = (p: Partial<ProgressState>) => {
      if (p.phase !== undefined) phase = p.phase;
      if (p.current !== undefined) current = p.current;
      if (p.total !== undefined) total = p.total;
      if (p.log) log.push(...p.log);
      dispatch({ type: 'SET_PROGRESS', payload: { active: true, phase, current, total, log: [...log], done: false, success: false, message: '' } });
    };

    try {
      await api.updateTags({
        folderPath: state.selectedFolder,
        tags: tagsToApply as AlbumTags,
        trackArtists,
        trackNames,
        moveFiles: mode === 'move',
        renameFiles: mode === 'rename' || mode === 'move',
      }, (event) => {
        switch (event.event) {
          case 'start':
            updateProgress({ phase: event.data.message, log: [event.data.message] });
            break;
          case 'phase':
            updateProgress({ phase: event.data.phase, current: 0, total: event.data.total });
            break;
          case 'file':
            updateProgress({ current: event.data.current, total: event.data.total });
            break;
          case 'log':
            updateProgress({ log: [event.data.message] });
            break;
          case 'done':
            updateProgress({ log: ['Operation complete'] });
            break;
          case 'error':
            updateProgress({ log: [`Error: ${event.data.error}`] });
            break;
        }
      });

      // Build result from accumulated log
      const result = { tagChanges: log.filter(l => l.includes('→')), moved: undefined as string[] | undefined, renamed: undefined as { from: string; to: string }[] | undefined };

      if (mode === 'move') {
        dispatch({ type: 'SET_PROGRESS', payload: { active: true, phase: 'Done', current: total, total, log: [...log, 'Operation complete'], done: true, success: true, message: 'Files processed successfully', details: result.tagChanges } });
        clearSelectionState();
        await fetchLibrary();
      } else if (mode === 'rename') {
        dispatch({ type: 'SET_PROGRESS', payload: { active: true, phase: 'Done', current: total, total, log: [...log, 'Operation complete'], done: true, success: true, message: 'Files renamed successfully', details: result.tagChanges } });
        const refreshedTags = await api.fetchTags(state.selectedFolder);
        dispatch({ type: 'SET_LOCAL_TAGS', payload: refreshedTags });
      } else {
        dispatch({ type: 'SET_PROGRESS', payload: { active: true, phase: 'Done', current: total, total, log: [...log, 'Operation complete'], done: true, success: true, message: 'Tags updated successfully', details: result.tagChanges } });
        const refreshedTags = await api.fetchTags(state.selectedFolder);
        dispatch({ type: 'SET_LOCAL_TAGS', payload: refreshedTags });
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[client] updateTags error:', err);
      dispatch({ type: 'SET_PROGRESS', payload: { active: true, phase: 'Error', current: 0, total: 0, log: [...log, String(err)], done: true, success: false, message: 'Failed to update tags' } });
    }
  };
}
