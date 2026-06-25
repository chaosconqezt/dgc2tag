import * as api from '../api';

export const DEFAULT_TAG_DEFAULTS: Record<string, boolean> = {
  artist: true, albumArtist: true, album: true, year: true,
  genre: true, country: true, label: true, releaseType: true, postId: true,
};

export type AppDispatch = React.Dispatch<{ type: string; payload?: unknown }>;

export interface ConfigState {
  configMusicRoot: string;
  configOutputFolder: string;
  configOutputMode: 'subfolder' | 'absolute';
  tagEnabled: Record<string, boolean>;
}

export function createConfigActions(
  state: ConfigState,
  dispatch: AppDispatch,
  fetchLibrary: () => Promise<void>,
) {
  return {
    fetchConfig: async () => {
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
    },

    saveConfig: async () => {
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
    },

    clearCache: async () => {
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
    },
  };
}
