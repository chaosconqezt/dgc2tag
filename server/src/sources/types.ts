import type { SearchResult } from '../scraper.js';

export interface SearchSource {
  id: string;
  label: string;
  accentColor: string;
  search(artist?: string, album?: string, query?: string): Promise<SearchResult[]>;
  getDetails?(id: string): Promise<SearchResult | null>;
}
