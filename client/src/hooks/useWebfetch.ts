import * as api from '../api';

export type AppDispatch = React.Dispatch<{ type: string; payload?: unknown }>;

export function createWebfetchActions(dispatch: AppDispatch) {
  return {
    handleWebfetch: async (url: string) => {
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
    },

    closeWebfetch: () => {
      dispatch({ type: 'SET_WEBFETCH_URL', payload: null });
      dispatch({ type: 'SET_WEBFETCH_CONTENT', payload: null });
    },
  };
}
