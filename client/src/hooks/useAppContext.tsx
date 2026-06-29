import { createContext, useContext, useReducer, useCallback, useRef, useMemo, useEffect } from 'react';
import type { SearchResult, DeezerSearchResult } from '../types';
import type { MusicBrainzSearchResult } from '../api';
import * as api from '../api';
import { appReducer, initialState, type AppState, type Action } from './appReducer';
import { createApplyTags } from './useTagActions';
import { createWebfetchActions } from './useWebfetch';
import { createConfigActions } from './useConfig';
import { createLibraryActions } from './useLibrary';
import { createSearchActions } from './useSearch';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseDispatch = React.Dispatch<{ type: string; payload?: any }>;


interface AppContextType extends AppState {
  dispatch: React.Dispatch<Action>;
  fetchConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
  clearCache: () => Promise<void>;
  fetchLibrary: () => Promise<void>;
  toggleNode: (path: string) => void;
  collapseAll: () => void;
  dirHasAudioFiles: (dirPath: string) => boolean;
  handleFolderSelect: (folderPath: string) => Promise<void>;
  renameNode: (oldPath: string, newName: string) => Promise<{ success: boolean; newPath: string }>;
  deleteNode: (filePath: string) => Promise<void>;
  moveNode: (oldPath: string, targetDir: string) => Promise<{ success: boolean; newPath: string }>;
  handleSearch: (artist?: string, album?: string, artistEnabled?: boolean, albumEnabled?: boolean) => Promise<void>;
  loadAlbumDetails: (postId: number) => Promise<void>;
  handleSelectResult: (res: SearchResult) => void;
  handleSelectDeezer: (dz: DeezerSearchResult) => void;
  handleSelectMbrainz: (mb: MusicBrainzSearchResult) => void;
  handleWebfetch: (url: string) => Promise<void>;
  closeWebfetch: () => void;
  clearSelectionState: () => void;
  applyTags: (mode: 'write' | 'rename' | 'move') => Promise<void>;
  fetchLibraryEntries: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const searchInProgressRef = useRef(false);
  const loadAlbumDetailsIdRef = useRef<number | string | null>(null);
  const searchGenerationRef = useRef(0);

  const clearSelectionState = useCallback(() => {
    loadAlbumDetailsIdRef.current = null;
    dispatch({ type: 'CLEAR_SELECTION_STATE' });
  }, []);

  const { handleSearch, loadAlbumDetails, handleSelectResult, handleSelectDeezer, handleSelectMbrainz } = useMemo(
    () => createSearchActions(
      { searchArtist: state.searchArtist, searchAlbum: state.searchAlbum, searchArtistEnabled: state.searchArtistEnabled, searchAlbumEnabled: state.searchAlbumEnabled, selectedResult: state.selectedResult, selectedDeezer: state.selectedDeezer, tagEnabled: state.tagEnabled, enabledSources: state.enabledSources },
      dispatch as LooseDispatch, clearSelectionState,
      { searchInProgress: searchInProgressRef, loadAlbumDetailsId: loadAlbumDetailsIdRef, searchGeneration: searchGenerationRef },
    ),
    [state.searchArtist, state.searchAlbum, state.searchArtistEnabled, state.searchAlbumEnabled, state.selectedResult, state.selectedDeezer, state.tagEnabled, state.enabledSources, dispatch, clearSelectionState],
  );

  const { fetchLibrary, toggleNode, collapseAll, dirHasAudioFiles, handleFolderSelect, renameNode, deleteNode, moveNode } = useMemo(
    () => createLibraryActions({ tree: state.tree, selectedFolder: state.selectedFolder }, dispatch as LooseDispatch, clearSelectionState, handleSearch),
    [state.tree, state.selectedFolder, dispatch, clearSelectionState, handleSearch],
  );

  const { fetchConfig, saveConfig, clearCache } = createConfigActions(
    { configMusicRoot: state.configMusicRoot, configOutputFolder: state.configOutputFolder, configOutputMode: state.configOutputMode, tagEnabled: state.tagEnabled, enabledSources: state.enabledSources, cleanupIgnorePatterns: state.cleanupIgnorePatterns },
    dispatch as LooseDispatch, fetchLibrary,
  );

  const { handleWebfetch, closeWebfetch } = createWebfetchActions(dispatch as LooseDispatch);

  const applyTags = useCallback(
    createApplyTags(state, dispatch as LooseDispatch, clearSelectionState, fetchLibrary),
    [state, clearSelectionState, fetchLibrary],
  );

  const fetchLibraryEntries = useCallback(async () => {
    try {
      const entries = await api.fetchLibraryAlbums();
      dispatch({ type: 'SET_LIBRARY_ENTRIES', payload: entries });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to fetch library entries', err);
    }
  }, [dispatch]);

  // Load library on startup
  useEffect(() => {
    fetchLibraryEntries();
  }, [fetchLibraryEntries]);

  const contextValue = useMemo(() => ({
    ...state, dispatch,
    fetchConfig, saveConfig, clearCache,
    fetchLibrary, toggleNode, collapseAll, dirHasAudioFiles, handleFolderSelect,
    renameNode, deleteNode, moveNode,
    handleSearch, loadAlbumDetails, handleSelectResult, handleSelectDeezer, handleSelectMbrainz,
    handleWebfetch, closeWebfetch, clearSelectionState, applyTags, fetchLibraryEntries,
  }), [state, dispatch, fetchConfig, saveConfig, clearCache, fetchLibrary, toggleNode, collapseAll, dirHasAudioFiles, handleFolderSelect, renameNode, deleteNode, moveNode, handleSearch, loadAlbumDetails, handleSelectResult, handleSelectDeezer, handleSelectMbrainz, handleWebfetch, closeWebfetch, clearSelectionState, applyTags, fetchLibraryEntries]);

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
