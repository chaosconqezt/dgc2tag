import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import type { FileNode, AlbumTags, SearchResult, DeezerSearchResult } from '../types';
import * as api from '../api';
import { matchTracks } from '../utils';

const DEFAULT_TAG_DEFAULTS: Record<string, boolean> = {
  artist: true, albumArtist: true, album: true, year: true,
  genre: true, country: true, label: true, releaseType: true, postId: true,
};

// ── State ───────────────────────────────────────────────────────────────────

interface AppState {
  // Library
  tree: FileNode[];
  selectedFolder: string | null;
  expandedNodes: Set<string>;

  // Tags
  localTags: AlbumTags | null;

  // Search
  searchResults: SearchResult[];
  deezerResults: DeezerSearchResult[];
  selectedResult: SearchResult | null;
  selectedDeezer: DeezerSearchResult | null;
  albumDetails: SearchResult | null;
  searchArtist: string;
  searchAlbum: string;
  searchArtistEnabled: boolean;
  searchAlbumEnabled: boolean;
  dgcLoading: boolean;
  deezerLoading: boolean;
  searchTimeMs: number | null;

  // UI state
  loading: boolean;
  webfetchUrl: string | null;
  webfetchContent: string | null;
  webfetchLoading: boolean;
  showSettings: boolean;
  resultModal: { success: boolean; message: string; details?: string[] } | null;

  // Config
  configMusicRoot: string;
  configOutputFolder: string;
  configOutputMode: 'subfolder' | 'absolute';
  configSaving: boolean;
  clearingCache: boolean;

  // Tag edit state
  tagEnabled: Record<string, boolean>;
  editedSiteValues: Record<string, string>;
  editedTrackNames: Record<string, string>;
  editedTrackArtists: Record<string, string>;
  writeTrackNames: boolean;
  writeTrackArtists: boolean;
  trackNameEnabled: Record<string, boolean>;
  trackArtistsEnabled: Record<string, boolean>;
  stripRemoteParentheses: boolean;
  compilation: boolean;
  serverParsedTracks: { num: string; artist: string; name: string; duration?: number }[] | null;
}

type Action =
  | { type: 'SET_TREE'; payload: FileNode[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SELECTED_FOLDER'; payload: string | null }
  | { type: 'SET_LOCAL_TAGS'; payload: AlbumTags | null }
  | { type: 'SET_SEARCH_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_DEEZER_RESULTS'; payload: DeezerSearchResult[] }
  | { type: 'SET_SELECTED_RESULT'; payload: SearchResult | null }
  | { type: 'SET_SELECTED_DEEZER'; payload: DeezerSearchResult | null }
  | { type: 'SET_ALBUM_DETAILS'; payload: SearchResult | null }
  | { type: 'SET_SEARCH_ARTIST'; payload: string }
  | { type: 'SET_SEARCH_ALBUM'; payload: string }
  | { type: 'SET_SEARCH_ARTIST_ENABLED'; payload: boolean }
  | { type: 'SET_SEARCH_ALBUM_ENABLED'; payload: boolean }
  | { type: 'SET_DGC_LOADING'; payload: boolean }
  | { type: 'SET_DEEZER_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_TIME'; payload: number | null }
  | { type: 'TOGGLE_NODE'; payload: string }
  | { type: 'COLLAPSE_ALL' }
  | { type: 'CLEAR_SELECTION_STATE' }
  | { type: 'SET_TAG_ENABLED'; payload: Record<string, boolean> }
  | { type: 'SET_TAG_ENABLED_KEY'; payload: { key: string; enabled: boolean } }
  | { type: 'SET_EDITED_SITE_VALUE'; payload: { key: string; value: string } }
  | { type: 'SET_EDITED_TRACK_NAME'; payload: { num: string; value: string } }
  | { type: 'SET_EDITED_TRACK_ARTIST'; payload: { num: string; value: string } }
  | { type: 'SET_WRITE_TRACK_NAMES'; payload: boolean }
  | { type: 'SET_WRITE_TRACK_ARTISTS'; payload: boolean }
  | { type: 'SET_TRACK_NAME_ENABLED'; payload: { num: string; enabled: boolean } }
  | { type: 'SET_TRACK_ARTISTS_ENABLED'; payload: { num: string; enabled: boolean } }
  | { type: 'SET_WEBFETCH_URL'; payload: string | null }
  | { type: 'SET_WEBFETCH_CONTENT'; payload: string | null }
  | { type: 'SET_WEBFETCH_LOADING'; payload: boolean }
  | { type: 'SET_SHOW_SETTINGS'; payload: boolean }
  | { type: 'SET_CONFIG_MUSIC_ROOT'; payload: string }
  | { type: 'SET_CONFIG_OUTPUT_FOLDER'; payload: string }
  | { type: 'SET_CONFIG_OUTPUT_MODE'; payload: 'subfolder' | 'absolute' }
  | { type: 'SET_CONFIG_SAVING'; payload: boolean }
  | { type: 'SET_CLEARING_CACHE'; payload: boolean }
  | { type: 'SET_STRIP_REMOTE_PARENS'; payload: boolean }
  | { type: 'SET_COMPILATION'; payload: boolean }
  | { type: 'SET_SERVER_PARSED_TRACKS'; payload: { num: string; artist: string; name: string; duration?: number }[] | null }
  | { type: 'SET_RESULT_MODAL'; payload: { success: boolean; message: string; details?: string[] } | null };

const initialState: AppState = {
  tree: [],
  selectedFolder: null,
  expandedNodes: new Set(),
  localTags: null,
  searchResults: [],
  deezerResults: [],
  selectedResult: null,
  selectedDeezer: null,
  albumDetails: null,
  searchArtist: '',
  searchAlbum: '',
  searchArtistEnabled: true,
  searchAlbumEnabled: true,
  dgcLoading: false,
  deezerLoading: false,
  searchTimeMs: null,
  loading: false,
  webfetchUrl: null,
  webfetchContent: null,
  webfetchLoading: false,
  showSettings: false,
  resultModal: null,
  configMusicRoot: '',
  configOutputFolder: 'dgc',
  configOutputMode: 'subfolder',
  configSaving: false,
  clearingCache: false,
  tagEnabled: { ...DEFAULT_TAG_DEFAULTS },
  editedSiteValues: {},
  editedTrackNames: {},
  editedTrackArtists: {},
  writeTrackNames: true,
  writeTrackArtists: false,
  trackNameEnabled: {},
  trackArtistsEnabled: {},
  stripRemoteParentheses: false,
  compilation: false,
  serverParsedTracks: null,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TREE': return { ...state, tree: action.payload };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_SELECTED_FOLDER': return { ...state, selectedFolder: action.payload };
    case 'SET_LOCAL_TAGS': return { ...state, localTags: action.payload };
    case 'SET_SEARCH_RESULTS': return { ...state, searchResults: action.payload };
    case 'SET_DEEZER_RESULTS': return { ...state, deezerResults: action.payload };
    case 'SET_SELECTED_RESULT': return { ...state, selectedResult: action.payload };
    case 'SET_SELECTED_DEEZER': return { ...state, selectedDeezer: action.payload };
    case 'SET_ALBUM_DETAILS': return { ...state, albumDetails: action.payload, compilation: action.payload?.compilation ?? state.compilation, serverParsedTracks: action.payload?.parsedTracks ?? null };
    case 'SET_SEARCH_ARTIST': return { ...state, searchArtist: action.payload };
    case 'SET_SEARCH_ALBUM': return { ...state, searchAlbum: action.payload };
    case 'SET_SEARCH_ARTIST_ENABLED': return { ...state, searchArtistEnabled: action.payload };
    case 'SET_SEARCH_ALBUM_ENABLED': return { ...state, searchAlbumEnabled: action.payload };
    case 'SET_DGC_LOADING': return { ...state, dgcLoading: action.payload };
    case 'SET_DEEZER_LOADING': return { ...state, deezerLoading: action.payload };
    case 'SET_SEARCH_TIME': return { ...state, searchTimeMs: action.payload };
    case 'TOGGLE_NODE': {
      const next = new Set(state.expandedNodes);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, expandedNodes: next };
    }
    case 'COLLAPSE_ALL': return { ...state, expandedNodes: new Set() };
    case 'CLEAR_SELECTION_STATE':
      return {
        ...state,
        selectedResult: null,
        selectedDeezer: null,
        albumDetails: null,
        tagEnabled: { ...DEFAULT_TAG_DEFAULTS },
        editedSiteValues: {},
        editedTrackNames: {},
        editedTrackArtists: {},
        trackNameEnabled: {},
        trackArtistsEnabled: {},
        compilation: false,
        serverParsedTracks: null,
      };
    case 'SET_TAG_ENABLED': return { ...state, tagEnabled: action.payload };
    case 'SET_TAG_ENABLED_KEY':
      return { ...state, tagEnabled: { ...state.tagEnabled, [action.payload.key]: action.payload.enabled } };
    case 'SET_EDITED_SITE_VALUE':
      return { ...state, editedSiteValues: { ...state.editedSiteValues, [action.payload.key]: action.payload.value } };
    case 'SET_EDITED_TRACK_NAME':
      return { ...state, editedTrackNames: { ...state.editedTrackNames, [action.payload.num]: action.payload.value } };
    case 'SET_EDITED_TRACK_ARTIST':
      return { ...state, editedTrackArtists: { ...state.editedTrackArtists, [action.payload.num]: action.payload.value } };
    case 'SET_WRITE_TRACK_NAMES': return { ...state, writeTrackNames: action.payload };
    case 'SET_WRITE_TRACK_ARTISTS': return { ...state, writeTrackArtists: action.payload };
    case 'SET_TRACK_NAME_ENABLED':
      return { ...state, trackNameEnabled: { ...state.trackNameEnabled, [action.payload.num]: action.payload.enabled } };
    case 'SET_TRACK_ARTISTS_ENABLED':
      return { ...state, trackArtistsEnabled: { ...state.trackArtistsEnabled, [action.payload.num]: action.payload.enabled } };
    case 'SET_WEBFETCH_URL': return { ...state, webfetchUrl: action.payload };
    case 'SET_WEBFETCH_CONTENT': return { ...state, webfetchContent: action.payload };
    case 'SET_WEBFETCH_LOADING': return { ...state, webfetchLoading: action.payload };
    case 'SET_SHOW_SETTINGS': return { ...state, showSettings: action.payload };
    case 'SET_CONFIG_MUSIC_ROOT': return { ...state, configMusicRoot: action.payload };
    case 'SET_CONFIG_OUTPUT_FOLDER': return { ...state, configOutputFolder: action.payload };
    case 'SET_CONFIG_OUTPUT_MODE': return { ...state, configOutputMode: action.payload };
    case 'SET_CONFIG_SAVING': return { ...state, configSaving: action.payload };
    case 'SET_CLEARING_CACHE': return { ...state, clearingCache: action.payload };
    case 'SET_STRIP_REMOTE_PARENS': return { ...state, stripRemoteParentheses: action.payload };
    case 'SET_COMPILATION': return { ...state, compilation: action.payload };
    case 'SET_SERVER_PARSED_TRACKS': return { ...state, serverParsedTracks: action.payload };
    case 'SET_RESULT_MODAL': return { ...state, resultModal: action.payload };
    default:
      return state;
  }
}

// ── Context ─────────────────────────────────────────────────────────────────

interface AppContextType extends AppState {
  dispatch: React.Dispatch<Action>;
  // Business logic helpers
  fetchConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
  clearCache: () => Promise<void>;
  fetchLibrary: () => Promise<void>;
  toggleNode: (path: string) => void;
  collapseAll: () => void;
  dirHasAudioFiles: (dirPath: string) => boolean;
  handleFolderSelect: (folderPath: string) => Promise<void>;
  handleSearch: (artist?: string, album?: string, artistEnabled?: boolean, albumEnabled?: boolean) => Promise<void>;
  loadAlbumDetails: (postId: number) => Promise<void>;
  handleSelectResult: (res: SearchResult) => void;
  handleSelectDeezer: (dz: DeezerSearchResult) => void;
  handleWebfetch: (url: string) => Promise<void>;
  closeWebfetch: () => void;
  clearSelectionState: () => void;
  applyTags: (mode: 'write' | 'rename' | 'move') => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchInProgressRef = useRef(false);
  const loadAlbumDetailsIdRef = useRef<number | null>(null);

  // ── Derived helpers ───────────────────────────────────────────────────────

  const toggleNode = useCallback((path: string) => {
    dispatch({ type: 'TOGGLE_NODE', payload: path });
  }, []);

  const collapseAll = useCallback(() => {
    dispatch({ type: 'COLLAPSE_ALL' });
  }, []);

  const dirHasAudioFiles = useCallback((dirPath: string): boolean => {
    const check = (nodes: FileNode[]): boolean => {
      for (const node of nodes) {
        if (node.path === dirPath && node.hasAudioFiles) return true;
        if (node.children && check(node.children)) return true;
      }
      return false;
    };
    return check(state.tree);
  }, [state.tree]);

  const clearSelectionState = useCallback(() => {
    loadAlbumDetailsIdRef.current = null;
    dispatch({ type: 'CLEAR_SELECTION_STATE' });
  }, []);

  // ── API actions ───────────────────────────────────────────────────────────

  const fetchConfig = useCallback(async () => {
    try {
      const data = await api.fetchConfig();
      dispatch({ type: 'SET_CONFIG_MUSIC_ROOT', payload: data.musicRoot });
      dispatch({ type: 'SET_CONFIG_OUTPUT_FOLDER', payload: data.outputFolder || 'dgc' });
      dispatch({ type: 'SET_CONFIG_OUTPUT_MODE', payload: data.outputMode || 'subfolder' });
      if (data.tagDefaults) {
        dispatch({ type: 'SET_TAG_ENABLED', payload: { ...DEFAULT_TAG_DEFAULTS, ...data.tagDefaults } });
      }
      dispatch({ type: 'SET_WRITE_TRACK_NAMES', payload: data.writeTrackNames ?? true });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to fetch config', err);
    }
  }, []);

  const saveConfig = useCallback(async () => {
    dispatch({ type: 'SET_CONFIG_SAVING', payload: true });
    try {
      await api.saveConfig(
        state.configMusicRoot,
        state.tagEnabled,
        state.configOutputFolder,
        state.configOutputMode,
      );
      dispatch({ type: 'SET_SHOW_SETTINGS', payload: false });
      await fetchLibrary();
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to save config', err);
      alert('Failed to save config');
    } finally {
      dispatch({ type: 'SET_CONFIG_SAVING', payload: false });
    }
  }, [state.configMusicRoot, state.tagEnabled, state.configOutputFolder, state.configOutputMode]);

  const clearCache = useCallback(async () => {
    dispatch({ type: 'SET_CLEARING_CACHE', payload: true });
    try {
      const result = await api.clearCache();
      alert(`Cache cleared! ${result.cleared} files removed.`);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to clear cache', err);
      alert('Failed to clear cache');
    } finally {
      dispatch({ type: 'SET_CLEARING_CACHE', payload: false });
    }
  }, []);

  const fetchLibrary = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await api.fetchLibrary();
      dispatch({ type: 'SET_TREE', payload: data });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to fetch library', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const handleFolderSelect = useCallback(async (folderPath: string) => {
    if (import.meta.env.DEV) console.log(`[client] folder selected: ${folderPath}`);
    dispatch({ type: 'SET_SELECTED_FOLDER', payload: folderPath });

    const hasAudio = dirHasAudioFiles(folderPath);
    if (!hasAudio) {
      if (import.meta.env.DEV) console.log(`[client] no audio files in ${folderPath}, skipping tag load`);
      clearSelectionState();
      return;
    }

    clearSelectionState();

    try {
      const tagsData = await api.fetchTags(folderPath);
      dispatch({ type: 'SET_LOCAL_TAGS', payload: tagsData });

      const folderName = folderPath.split(/[\\/]/).pop() || '';
      const isVarious = tagsData.artist === 'Various Artists';
      const artist = isVarious ? '' : (tagsData.artist || '');
      const cleanAlbum = (tagsData.album || '').replace(/\s*[\(\[].*?[\)\]]\s*/g, ' ').replace(/\s+/g, ' ').trim();
      const album = cleanAlbum || folderName.replace(/^\d{4}\s*-\s*/, '').replace(/-/g, ' ');

      dispatch({ type: 'SET_SEARCH_ARTIST', payload: artist });
      dispatch({ type: 'SET_SEARCH_ALBUM', payload: album });
      dispatch({ type: 'SET_SEARCH_ARTIST_ENABLED', payload: !!artist });
      dispatch({ type: 'SET_SEARCH_ALBUM_ENABLED', payload: true });

      await handleSearch(artist, album, !!artist, true);
    } catch {
      if (import.meta.env.DEV) console.error('Failed to fetch tags');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dirHasAudioFiles, clearSelectionState]);

  const handleSearch = useCallback(async (artist?: string, album?: string, artistEnabled?: boolean, albumEnabled?: boolean) => {
    if (searchInProgressRef.current) return;
    searchInProgressRef.current = true;

    const a = artistEnabled !== undefined ? artistEnabled : state.searchArtistEnabled;
    const b = albumEnabled !== undefined ? albumEnabled : state.searchAlbumEnabled;
    const dgcQuery = [a ? (artist || state.searchArtist) : '', b ? (album || state.searchAlbum) : ''].filter(Boolean).join(' ');
    if (!dgcQuery) return;

    if (import.meta.env.DEV) console.log(`[client] search DGC: "${dgcQuery}"`);
    dispatch({ type: 'SET_DGC_LOADING', payload: true });
    dispatch({ type: 'SET_DEEZER_LOADING', payload: true });
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
    dispatch({ type: 'SET_DEEZER_RESULTS', payload: [] });
    dispatch({ type: 'SET_SEARCH_TIME', payload: null });

    const start = Date.now();
    const dzArtist = a ? (artist || state.searchArtist) : undefined;
    const dzAlbum = b ? (album || state.searchAlbum) : undefined;

    api.searchAlbums(dgcQuery)
      .then(data => {
        if (import.meta.env.DEV) console.log(`[client] DGC results: ${data.length}`);
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: data });
      })
      .catch(err => {
        if (import.meta.env.DEV) console.error('[client] DGC search error:', err);
      })
      .finally(() => dispatch({ type: 'SET_DGC_LOADING', payload: false }));

    api.searchAlbumsDeezer(dzArtist, dzAlbum)
      .then(data => {
        if (import.meta.env.DEV) console.log(`[client] Deezer results: ${data.length}`);
        dispatch({ type: 'SET_DEEZER_RESULTS', payload: data });
      })
      .catch(() => {})
      .finally(() => {
        dispatch({ type: 'SET_DEEZER_LOADING', payload: false });
        dispatch({ type: 'SET_SEARCH_TIME', payload: Date.now() - start });
        searchInProgressRef.current = false;
      });
  }, [state.searchArtist, state.searchAlbum, state.searchArtistEnabled, state.searchAlbumEnabled]);

  const loadAlbumDetails = useCallback(async (postId: number) => {
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
  }, []);

  const handleSelectResult = useCallback((res: SearchResult) => {
    if (state.selectedResult?.postId === res.postId) return;
    clearSelectionState();
    dispatch({ type: 'SET_SELECTED_RESULT', payload: res });
    dispatch({ type: 'SET_ALBUM_DETAILS', payload: null });
    loadAlbumDetails(res.postId);
  }, [state.selectedResult, clearSelectionState, loadAlbumDetails]);

  const handleSelectDeezer = useCallback((dz: DeezerSearchResult) => {
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
    // Merge tag defaults for Deezer
    dispatch({ type: 'SET_TAG_ENABLED', payload: { ...state.tagEnabled, artist: true, album: true, year: true, label: true, postId: false } });
  }, [state.selectedDeezer, state.tagEnabled, clearSelectionState]);

  const handleWebfetch = useCallback(async (url: string) => {
    dispatch({ type: 'SET_WEBFETCH_URL', payload: url });
    dispatch({ type: 'SET_WEBFETCH_LOADING', payload: true });
    dispatch({ type: 'SET_WEBFETCH_CONTENT', payload: null });
    try {
      const data = await api.webfetchPage(url);
      dispatch({ type: 'SET_WEBFETCH_CONTENT', payload: data.content });
    } catch (err) {
      if (import.meta.env.DEV) console.error('[client] webfetch error:', err);
      dispatch({ type: 'SET_WEBFETCH_CONTENT', payload: '<p style="color:#ef4444">Failed to load page</p>' });
    } finally {
      dispatch({ type: 'SET_WEBFETCH_LOADING', payload: false });
    }
  }, []);

  const closeWebfetch = useCallback(() => {
    dispatch({ type: 'SET_WEBFETCH_URL', payload: null });
    dispatch({ type: 'SET_WEBFETCH_CONTENT', payload: null });
  }, []);

  // Strip "(text)" from a string, including preceding space
  const stripParentheses = useCallback((s: string): string => {
    return s.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  }, []);

  const applyTags = useCallback(async (mode: 'write' | 'rename' | 'move' = 'write') => {
    if (!state.selectedFolder || (!state.selectedResult && !state.localTags)) return;

    const sr = state.selectedResult;
    const tagsToApply: Record<string, string> = {};
    const applyStrip = (v: string): string => state.stripRemoteParentheses ? stripParentheses(v) : v;

    // Resolve source values: editedSiteValues > remote > localTags
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

    // Generate parsedTracks from local tags when no albumDetails
    const parsedTracks = state.albumDetails?.parsedTracks ?? (state.localTags?.files || []).map((filePath, i) => {
      const fileName = filePath.split(/[/\\]/).pop() || '';
      const numMatch = fileName.match(/^(\d{1,3})/);
      const num = numMatch?.[1] || String(i + 1).padStart(2, '0');
      const artist = state.localTags?.trackArtists?.[filePath] || state.localTags?.artist || '';
      const name = state.localTags?.trackTitles?.[filePath] || fileName.replace(/^\d+[\.\s)]*\s*/, '').replace(/\.mp3$/i, '');
      return { num, artist, name };
    });

    const matched = parsedTracks && state.localTags?.files
      ? matchTracks(parsedTracks, state.localTags.files, state.localTags.trackTitles, false, 'id3')
      : [];

    // Build maps keyed by FULL FILE PATH (immutable identifier)
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
        renameFiles: mode === 'rename' || mode === 'move', // MOVE always includes RENAME
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
  }, [state, clearSelectionState, fetchLibrary]);



  const contextValue: AppContextType = {
    ...state,
    dispatch,
    fetchConfig,
    saveConfig,
    clearCache,
    fetchLibrary,
    toggleNode,
    collapseAll,
    dirHasAudioFiles,
    handleFolderSelect,
    handleSearch,
    loadAlbumDetails,
    handleSelectResult,
    handleSelectDeezer,
    handleWebfetch,
    closeWebfetch,
    clearSelectionState,
    applyTags,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
