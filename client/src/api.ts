import axios from 'axios';
import type { FileNode, AlbumTags, SearchResult, DeezerSearchResult } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

// Track active controllers to cancel on unmount
const activeControllers = new Map<string, AbortController>();
let requestCounter = 0;

export function getActiveRequestCount(): number {
  return activeControllers.size;
}

/** Cancel all in-flight requests (call on unmount) */
export function cancelActiveRequests(): void {
  for (const controller of activeControllers.values()) {
    controller.abort();
  }
  activeControllers.clear();
}

function createRequestId(): string {
  return `req-${++requestCounter}-${Date.now()}`;
}

// Axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
});

// Request interceptor: attach AbortController
api.interceptors.request.use((config) => {
  const controller = new AbortController();
  const requestId = createRequestId();
  (config as Record<string, unknown>).signal = controller.signal;
  (config as Record<string, unknown>)._requestId = requestId;
  activeControllers.set(requestId, controller);
  return config;
});

// Response interceptor: cleanup controller + handle errors
api.interceptors.response.use(
  (response) => {
    const requestId = (response.config as Record<string, unknown>)._requestId as string;
    if (requestId) activeControllers.delete(requestId);
    return response;
  },
  (error) => {
    // Cleanup controller on error too
    const requestId = (error.config as Record<string, unknown>)?._requestId as string;
    if (requestId) activeControllers.delete(requestId);

    // If cancelled due to unmount, don't log as error
    if (axios.isCancel(error)) {
      return Promise.reject(new Error('Request cancelled')); // Silent cancellation
    }

    let message = 'Unknown error';
    if (error.response) {
      // Server responded with error status
      message = error.response.data?.error ?? error.response.data?.message ?? `Server error ${error.response.status}`;
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'Request timed out';
    } else if (error.message === 'Network Error') {
      message = 'Connection failed. Is the server running?';
    }

    const apiError = new Error(message) as Error & { status?: number };
    apiError.status = error.response?.status;
    return Promise.reject(apiError);
  }
);

export async function fetchConfig(): Promise<{ musicRoot: string; port: number; tagDefaults: Record<string, boolean>; writeTrackNames: boolean; writeTrackArtists: boolean; outputFolder: string; outputMode: 'subfolder' | 'absolute'; cleanupIgnorePatterns: string[] }> {
  const res = await api.get('/config');
  return res.data;
}

export async function saveConfig(musicRoot: string, tagDefaults?: Record<string, boolean>, outputFolder?: string, outputMode?: 'subfolder' | 'absolute', enabledSources?: Record<string, boolean>, cleanupIgnorePatterns?: string[]): Promise<void> {
  await api.post('/config', { musicRoot, tagDefaults, outputFolder, outputMode, enabledSources, cleanupIgnorePatterns });
}

export async function fetchLibrary(): Promise<FileNode[]> {
  const res = await api.get('/library');
  return res.data;
}

export async function fetchDirectoryChildren(dirPath: string): Promise<FileNode[]> {
  const res = await api.get('/library/children', { params: { dirPath } });
  return res.data;
}

export async function fetchTags(folderPath: string): Promise<AlbumTags> {
  const res = await api.get('/tags', { params: { folderPath } });
  return res.data;
}

export async function searchAlbums(query: string): Promise<SearchResult[]> {
  const res = await api.post('/search', { query });
  return res.data;
}

export async function sourceSearch(sourceId: string, artist?: string, album?: string): Promise<SearchResult[]> {
  const res = await api.post(`/search-${sourceId}`, { artist, album });
  return res.data;
}

export async function sourceGetDetails(sourceId: string, id: string): Promise<SearchResult | null> {
  const res = await api.get(`/${sourceId}/${id}`);
  return res.data;
}

export async function fetchAlbumDetails(postId: number): Promise<SearchResult> {
  const res = await api.get(`/post/${postId}`);
  return res.data;
}

export interface ProgressEvent {
  event: 'start' | 'phase' | 'file' | 'log' | 'done' | 'error';
  data: any;
}

export async function updateTags(
  payload: {
    folderPath: string;
    tags: AlbumTags;
    trackArtists?: Record<string, string>;
    trackNames?: Record<string, string>;
    moveFiles: boolean;
    renameFiles?: boolean;
  },
  onProgress: (event: ProgressEvent) => void,
): Promise<void> {
  const controller = new AbortController();
  const key = `tags-update-${++requestCounter}`;
  activeControllers.set(key, controller);

  const res = await fetch(`${API_BASE}/tags/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    onProgress({ event: 'error', data: err });
    activeControllers.delete(key);
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    let eventType = '';
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith('data: ') && eventType) {
        try {
          const data = JSON.parse(line.slice(6));
          onProgress({ event: eventType as ProgressEvent['event'], data });
        } catch {}
        eventType = '';
      }
    }
  }
  activeControllers.delete(key);
}

export async function webfetchPage(url: string, signal?: AbortSignal): Promise<{ content: string }> {
  const res = await api.get('/webfetch', { params: { url }, signal });
  return res.data;
}

export async function parseGenresFromPage(html: string): Promise<{ genres: string[]; types: string[] }> {
  const res = await api.post('/parse-genres', { html });
  return res.data;
}

export async function clearCache(): Promise<{ success: boolean; cleared: number }> {
  const res = await api.post('/cache/clear');
  return res.data;
}

export async function setWriteTrackNames(enabled: boolean): Promise<{ writeTrackNames: boolean }> {
  const res = await api.post('/config/write-track-names', { enabled });
  return res.data;
}

export async function setWriteTrackArtists(enabled: boolean): Promise<{ writeTrackArtists: boolean }> {
  const res = await api.post('/config/write-track-artists', { enabled });
  return res.data;
}

export async function getBrowserStatus(): Promise<{ connected: boolean; hasPage: boolean }> {
  const res = await api.get('/browser/status');
  return res.data;
}

export async function searchAlbumsDeezer(artist?: string, album?: string): Promise<DeezerSearchResult[]> {
  const res = await api.post('/search-deezer', { artist, album });
  return res.data;
}

export interface MusicBrainzSearchResult {
  source: 'musicbrainz';
  id: string;
  releaseId: string;
  title: string;
  artist: string;
  artistId: string | null;
  releaseGroupId: string | null;
  catalogNumber: string | null;
  discId: string | null;
  originalYear: string | null;
  year: string | null;
  label: string | null;
  releaseType: string | null;
  status: string | null;
  country: string | null;
  trackCount: number;
  tracks: { num: string; name: string; artist: string; duration?: number; recordingId?: string }[];
  url: string;
  tags: string[];
  extraTags: Record<string, string>;
}

export async function searchAlbumsMusicBrainz(artist?: string, album?: string): Promise<MusicBrainzSearchResult[]> {
  const res = await api.post('/search-mbrainz', { artist, album });
  return res.data;
}

export async function fetchMusicBrainzRelease(releaseId: string): Promise<MusicBrainzSearchResult> {
  const res = await api.get(`/mbrainz/${releaseId}`);
  return res.data;
}

export async function searchAlbumsBandcamp(artist?: string, album?: string): Promise<SearchResult[]> {
  const res = await api.post('/search-bandcamp', { artist, album });
  return res.data;
}
