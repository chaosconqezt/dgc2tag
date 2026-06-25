import type { FileNode, AlbumTags } from '../types';
import * as api from '../api';

export type AppDispatch = React.Dispatch<{ type: string; payload?: unknown }>;

export interface LibraryState {
  tree: FileNode[];
}

export function createLibraryActions(
  state: LibraryState,
  dispatch: AppDispatch,
  clearSelectionState: () => void,
  handleSearch: (artist?: string, album?: string, artistEnabled?: boolean, albumEnabled?: boolean) => Promise<void>,
) {
  const dirHasAudioFiles = (dirPath: string): boolean => {
    const check = (nodes: FileNode[]): boolean => {
      for (const node of nodes) {
        if (node.path === dirPath && node.hasAudioFiles) return true;
        if (node.children && check(node.children)) return true;
      }
      return false;
    };
    return check(state.tree);
  };

  return {
    fetchLibrary: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await api.fetchLibrary();
        dispatch({ type: 'SET_TREE', payload: data });
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to fetch library', err);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    toggleNode: (path: string) => {
      dispatch({ type: 'TOGGLE_NODE', payload: path });
    },

    collapseAll: () => {
      dispatch({ type: 'COLLAPSE_ALL' });
    },

    dirHasAudioFiles,

    handleFolderSelect: async (folderPath: string) => {
      if (import.meta.env.DEV) console.log(`[client] folder selected: ${folderPath}`);
      dispatch({ type: 'SET_SELECTED_FOLDER', payload: folderPath });

      if (!dirHasAudioFiles(folderPath)) {
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
    },
  };
}
