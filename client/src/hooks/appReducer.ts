import type { FileNode, AlbumTags, SearchResult, DeezerSearchResult } from '../types';
import type { MusicBrainzSearchResult } from '../api';
import { DEFAULT_TAG_DEFAULTS } from './useConfig';

export interface AppState {
  tree: FileNode[];
  selectedFolder: string | null;
  expandedNodes: Set<string>;
  localTags: AlbumTags | null;
  searchResults: SearchResult[];
  deezerResults: DeezerSearchResult[];
  mbrainzResults: MusicBrainzSearchResult[];
  bandcampResults: SearchResult[];
  selectedMbrainz: MusicBrainzSearchResult | null;
  selectedResult: SearchResult | null;
  selectedDeezer: DeezerSearchResult | null;
  albumDetails: SearchResult | null;
  searchArtist: string;
  searchAlbum: string;
  searchArtistEnabled: boolean;
  searchAlbumEnabled: boolean;
  dgcLoading: boolean;
  deezerLoading: boolean;
  mbrainzLoading: boolean;
  bandcampLoading: boolean;
  progress: { active: boolean; phase: string; current: number; total: number; log: string[]; done: boolean; success: boolean; message: string; details?: string[] } | null;
  searchTimeMs: number | null;
  loading: boolean;
  webfetchUrl: string | null;
  webfetchContent: string | null;
  webfetchLoading: boolean;
  showSettings: boolean;
  resultModal: { success: boolean; message: string; details?: string[] } | null;
  configMusicRoot: string;
  configOutputFolder: string;
  configOutputMode: 'subfolder' | 'absolute';
  configSaving: boolean;
  clearingCache: boolean;
  enabledSources: Record<string, boolean>;
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

export type Action =
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
  | { type: 'SET_MBRAINZ_RESULTS'; payload: MusicBrainzSearchResult[] }
  | { type: 'SET_MBRAINZ_LOADING'; payload: boolean }
  | { type: 'SET_SELECTED_MBRAINZ'; payload: MusicBrainzSearchResult | null }
  | { type: 'SET_BANDCAMP_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_BANDCAMP_LOADING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: { active: boolean; phase: string; current: number; total: number; log: string[]; done: boolean; success: boolean; message: string; details?: string[] } | null }
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
  | { type: 'SET_ENABLED_SOURCES'; payload: Record<string, boolean> }
  | { type: 'SET_STRIP_REMOTE_PARENS'; payload: boolean }
  | { type: 'SET_COMPILATION'; payload: boolean }
  | { type: 'SET_SERVER_PARSED_TRACKS'; payload: { num: string; artist: string; name: string; duration?: number }[] | null }
  | { type: 'SET_RESULT_MODAL'; payload: { success: boolean; message: string; details?: string[] } | null };

export const initialState: AppState = {
  tree: [],
  selectedFolder: null,
  expandedNodes: new Set(),
  localTags: null,
  searchResults: [],
  deezerResults: [],
  mbrainzResults: [],
  bandcampResults: [],
  selectedMbrainz: null,
  selectedResult: null,
  selectedDeezer: null,
  albumDetails: null,
  searchArtist: '',
  searchAlbum: '',
  searchArtistEnabled: true,
  searchAlbumEnabled: true,
  dgcLoading: false,
  deezerLoading: false,
  mbrainzLoading: false,
  bandcampLoading: false,
  progress: null,
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
  enabledSources: { dgc: true, deezer: true, mbrainz: true, bandcamp: true },
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

export function appReducer(state: AppState, action: Action): AppState {
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
    case 'SET_MBRAINZ_RESULTS': return { ...state, mbrainzResults: action.payload };
    case 'SET_MBRAINZ_LOADING': return { ...state, mbrainzLoading: action.payload };
    case 'SET_SELECTED_MBRAINZ': return { ...state, selectedMbrainz: action.payload };
    case 'SET_BANDCAMP_RESULTS': return { ...state, bandcampResults: action.payload };
    case 'SET_BANDCAMP_LOADING': return { ...state, bandcampLoading: action.payload };
    case 'SET_PROGRESS': return { ...state, progress: action.payload };
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
        selectedMbrainz: null,
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
    case 'SET_ENABLED_SOURCES': return { ...state, enabledSources: action.payload };
    case 'SET_STRIP_REMOTE_PARENS': return { ...state, stripRemoteParentheses: action.payload };
    case 'SET_COMPILATION': return { ...state, compilation: action.payload };
    case 'SET_SERVER_PARSED_TRACKS': return { ...state, serverParsedTracks: action.payload };
    case 'SET_RESULT_MODAL': return { ...state, resultModal: action.payload };
    default:
      return state;
  }
}
