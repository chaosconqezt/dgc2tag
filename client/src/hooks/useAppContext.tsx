import { createContext, useContext, useReducer, useCallback, useRef, useMemo } from 'react';
import type { SearchResult, DeezerSearchResult } from '../types';
import type { MusicBrainzSearchResult } from '../api';
import { appReducer, initialState, type AppState, type Action } from './appReducer';
import { createApplyTags } from './useTagActions';
import { createWebfetchActions } from './useWebfetch';
import { createConfigActions } from './useConfig';
import { createLibraryActions } from './useLibrary';
import { createSearchActions } from './useSearch';

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
  handleSearch: (artist?: string, album?: string, artistEnabled?: boolean, albumEnabled?: boolean) => Promise<void>;
  loadAlbumDetails: (postId: number) => Promise<void>;
  handleSelectResult: (res: SearchResult) => void;
  handleSelectDeezer: (dz: DeezerSearchResult) => void;
  handleSelectMbrainz: (mb: MusicBrainzSearchResult) => void;
  handleWebfetch: (url: string) => Promise<void>;
  closeWebfetch: () => void;
  clearSelectionState: () => void;
  applyTags: (mode: 'write' | 'rename' | 'move') => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const searchInProgressRef = useRef(false);
  const loadAlbumDetailsIdRef = useRef<number | null>(null);
  const searchGenerationRef = useRef(0);

  const clearSelectionState = useCallback(() => {
    loadAlbumDetailsIdRef.current = null;
    dispatch({ type: 'CLEAR_SELECTION_STATE' });
  }, []);

  const { handleSearch, loadAlbumDetails, handleSelectResult, handleSelectDeezer, handleSelectMbrainz } = useMemo(
    () => createSearchActions(
      { searchArtist: state.searchArtist, searchAlbum: state.searchAlbum, searchArtistEnabled: state.searchArtistEnabled, searchAlbumEnabled: state.searchAlbumEnabled, selectedResult: state.selectedResult, selectedDeezer: state.selectedDeezer, tagEnabled: state.tagEnabled, enabledSources: state.enabledSources },
      dispatch, clearSelectionState,
      { searchInProgress: searchInProgressRef, loadAlbumDetailsId: loadAlbumDetailsIdRef, searchGeneration: searchGenerationRef },
    ),
    [state.searchArtist, state.searchAlbum, state.searchArtistEnabled, state.searchAlbumEnabled, state.selectedResult, state.selectedDeezer, state.tagEnabled, state.enabledSources, dispatch, clearSelectionState],
  );

  const { fetchLibrary, toggleNode, collapseAll, dirHasAudioFiles, handleFolderSelect } = useMemo(
    () => createLibraryActions({ tree: state.tree }, dispatch, clearSelectionState, handleSearch),
    [state.tree, dispatch, clearSelectionState, handleSearch],
  );

  const { fetchConfig, saveConfig, clearCache } = createConfigActions(
    { configMusicRoot: state.configMusicRoot, configOutputFolder: state.configOutputFolder, configOutputMode: state.configOutputMode, tagEnabled: state.tagEnabled, enabledSources: state.enabledSources, cleanupIgnorePatterns: state.cleanupIgnorePatterns },
    dispatch, fetchLibrary,
  );

  const { handleWebfetch, closeWebfetch } = createWebfetchActions(dispatch);

  const applyTags = useCallback(
    createApplyTags(state, dispatch, clearSelectionState, fetchLibrary),
    [state, clearSelectionState, fetchLibrary],
  );

  const contextValue = useMemo(() => ({
    ...state, dispatch,
    fetchConfig, saveConfig, clearCache,
    fetchLibrary, toggleNode, collapseAll, dirHasAudioFiles, handleFolderSelect,
    handleSearch, loadAlbumDetails, handleSelectResult, handleSelectDeezer, handleSelectMbrainz,
    handleWebfetch, closeWebfetch, clearSelectionState, applyTags,
  }), [state, dispatch, fetchConfig, saveConfig, clearCache, fetchLibrary, toggleNode, collapseAll, dirHasAudioFiles, handleFolderSelect, handleSearch, loadAlbumDetails, handleSelectResult, handleSelectDeezer, handleSelectMbrainz, handleWebfetch, closeWebfetch, clearSelectionState, applyTags]);

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
