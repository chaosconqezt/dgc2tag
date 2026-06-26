import * as api from '../api';

export type AppDispatch = React.Dispatch<{ type: string; payload?: unknown }>;

let webfetchController: AbortController | null = null;

export function createWebfetchActions(dispatch: AppDispatch) {
  return {
    handleWebfetch: async (url: string) => {
      if (webfetchController) webfetchController.abort();
      webfetchController = new AbortController();
      dispatch({ type: 'SET_WEBFETCH_URL', payload: url });
      dispatch({ type: 'SET_WEBFETCH_LOADING', payload: true });
      dispatch({ type: 'SET_WEBFETCH_CONTENT', payload: null });
      try {
        const data = await api.webfetchPage(url, webfetchController.signal);
        dispatch({ type: 'SET_WEBFETCH_CONTENT', payload: data.content });
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        if (import.meta.env.DEV) console.error('[client] webfetch error:', err);
        dispatch({ type: 'SET_WEBFETCH_CONTENT', payload: '<p style="color:#ef4444">Failed to load page</p>' });
      } finally {
        webfetchController = null;
        dispatch({ type: 'SET_WEBFETCH_LOADING', payload: false });
      }
    },

    closeWebfetch: () => {
      if (webfetchController) webfetchController.abort();
      webfetchController = null;
      dispatch({ type: 'SET_WEBFETCH_URL', payload: null });
      dispatch({ type: 'SET_WEBFETCH_CONTENT', payload: null });
    },
  };
}
