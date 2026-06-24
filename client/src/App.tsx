import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { AppProvider, useAppContext } from './hooks/useAppContext';
import type { FileNode, AlbumTags, SearchResult, DeezerSearchResult } from './types';
import * as api from './api';
import { RefreshCw, Layout, Settings } from 'lucide-react';
import { FONT, FS } from './components/styles';
import { parseCompilationTracklist } from './utils';
import { WebfetchOverlay } from './components/WebfetchOverlay';
import { SettingsModal } from './components/SettingsModal';
import { LibraryTree } from './components/LibraryTree';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { TagComparison } from './components/TagComparison';
import { TrackMatcher } from './components/TrackMatcher';
import { ApplyPanel } from './components/ApplyPanel';
import { Footer } from './components/Footer';

function AppContent() {
  const ctx = useAppContext();

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      await ctx.fetchConfig();
      await ctx.fetchLibrary();
    };
    init();
    return () => {
      api.cancelActiveRequests();
    };
  }, []);

  return (
    <div className="dashboard" style={{ display: 'flex', height: '100vh', backgroundColor: '#09090b', color: '#f4f4f5', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Sidebar: Library Tree */}
      <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #27272a' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#0c0c0e', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h2 style={{ fontSize: FS, fontWeight: '600', margin: 0, letterSpacing: '0.3px', fontFamily: FONT, color: '#f4f4f5' }}>
              DGC TAGGER
            </h2>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={ctx.collapseAll} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex', fontSize: FS, fontWeight: '700' }} title="Collapse all">
                &#9650;
              </button>
              <button onClick={() => ctx.dispatch({ type: 'SET_SHOW_SETTINGS', payload: true })} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex' }}>
                <Settings size={14} />
              </button>
              <button onClick={ctx.fetchLibrary} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex' }}>
                <RefreshCw size={14} className={ctx.loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <LibraryTree
            tree={ctx.tree}
            selectedFolder={ctx.selectedFolder}
            expandedNodes={ctx.expandedNodes}
            onToggleNode={ctx.toggleNode}
            onSelectFolder={ctx.handleFolderSelect}
            onCollapseAll={ctx.collapseAll}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Content Split: Comparison Panel */}
        <div className="bottom-panels" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Comparison Panel */}
          <div className="diff-panel" style={{ flex: 1, padding: '16px 20px', backgroundColor: '#0c0c0e', overflowY: 'auto' }}>

            {/* Search bar */}
            <SearchBar
              artist={ctx.searchArtist}
              album={ctx.searchAlbum}
              artistEnabled={ctx.searchArtistEnabled}
              albumEnabled={ctx.searchAlbumEnabled}
              onArtistChange={(v) => ctx.dispatch({ type: 'SET_SEARCH_ARTIST', payload: v })}
              onAlbumChange={(v) => ctx.dispatch({ type: 'SET_SEARCH_ALBUM', payload: v })}
              onArtistEnabledChange={(v) => ctx.dispatch({ type: 'SET_SEARCH_ARTIST_ENABLED', payload: v })}
              onAlbumEnabledChange={(v) => ctx.dispatch({ type: 'SET_SEARCH_ALBUM_ENABLED', payload: v })}
              onSearch={() => ctx.handleSearch()}
            />

            {/* Matches: DGC + Deezer horizontal */}
            <SearchResults
              results={ctx.searchResults}
              deezerResults={ctx.deezerResults}
              dgcLoading={ctx.dgcLoading}
              deezerLoading={ctx.deezerLoading}
              searchTimeMs={ctx.searchTimeMs}
              selectedResult={ctx.selectedResult}
              onSelectResult={ctx.handleSelectResult}
              onSelectDeezer={ctx.handleSelectDeezer}
              selectedDeezerId={ctx.selectedDeezer?.albumId ?? null}
            />

            {(ctx.selectedResult || ctx.localTags) ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <TagComparison
                  selectedResult={ctx.selectedResult}
                  localTags={ctx.localTags}
                  tagEnabled={ctx.tagEnabled}
                  editedSiteValues={ctx.editedSiteValues}
                  stripRemoteParentheses={ctx.stripRemoteParentheses}
                  onTagEnabledChange={(key, enabled) => ctx.dispatch({ type: 'SET_TAG_ENABLED_KEY', payload: { key, enabled } })}
                  onEditedSiteValuesChange={(key, value) => ctx.dispatch({ type: 'SET_EDITED_SITE_VALUE', payload: { key, value } })}
                />

                <TrackMatcher
                  key={ctx.selectedResult?.postId ?? 'local'}
                  albumDetails={ctx.albumDetails}
                  localTags={ctx.localTags}
                  writeTrackNames={ctx.writeTrackNames}
                  writeTrackArtists={ctx.writeTrackArtists}
                  trackNameEnabled={ctx.trackNameEnabled}
                  trackArtistsEnabled={ctx.trackArtistsEnabled}
                  editedTrackNames={ctx.editedTrackNames}
                  editedTrackArtists={ctx.editedTrackArtists}
                  stripRemoteParentheses={ctx.stripRemoteParentheses}
                  compilation={ctx.compilation}
                  onStripRemoteParenthesesChange={(enabled) => ctx.dispatch({ type: 'SET_STRIP_REMOTE_PARENS', payload: enabled })}
                  onWriteTrackNamesChange={(enabled) => { ctx.dispatch({ type: 'SET_WRITE_TRACK_NAMES', payload: enabled }); api.setWriteTrackNames(enabled); }}
                  onWriteTrackArtistsChange={(enabled) => { ctx.dispatch({ type: 'SET_WRITE_TRACK_ARTISTS', payload: enabled }); api.setWriteTrackArtists(enabled); }}
                  onTrackNameEnabledChange={(num, enabled) => ctx.dispatch({ type: 'SET_TRACK_NAME_ENABLED', payload: { num, enabled } })}
                  onTrackArtistsEnabledChange={(num, enabled) => ctx.dispatch({ type: 'SET_TRACK_ARTISTS_ENABLED', payload: { num, enabled } })}
                  onEditedTrackNameChange={(num, value) => ctx.dispatch({ type: 'SET_EDITED_TRACK_NAME', payload: { num, value } })}
                  onEditedTrackArtistChange={(num, value) => ctx.dispatch({ type: 'SET_EDITED_TRACK_ARTIST', payload: { num, value } })}
                  onCompilationChange={(enabled) => {
                    ctx.dispatch({ type: 'SET_COMPILATION', payload: enabled });
                    if (ctx.albumDetails?.tracklist) {
                      if (enabled) {
                        const parsed = parseCompilationTracklist(ctx.albumDetails.tracklist);
                        ctx.dispatch({ type: 'SET_ALBUM_DETAILS', payload: { ...ctx.albumDetails, parsedTracks: parsed, compilation: true } });
                      } else if (ctx.serverParsedTracks) {
                        ctx.dispatch({ type: 'SET_ALBUM_DETAILS', payload: { ...ctx.albumDetails, parsedTracks: ctx.serverParsedTracks, compilation: false } });
                      }
                    }
                  }}
                />

                {ctx.albumDetails?.notes && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#111114', borderRadius: '8px', border: '1px solid #27272a' }}>
                    <div style={{ fontSize: FS, color: '#71717a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontFamily: FONT }}>NOTES</div>
                    <p style={{ fontSize: FS, color: '#a1a1aa', margin: 0, lineHeight: '1.5', fontFamily: FONT }}>{ctx.albumDetails.notes}</p>
                  </div>
                )}

                <ApplyPanel
                  selectedResult={ctx.selectedResult}
                  localTags={ctx.localTags}
                  onApplyTags={ctx.applyTags}
                />
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#3f3f46', opacity: 0.5 }}>
                <Layout size={40} style={{ marginBottom: '10px' }} />
                <p style={{ fontWeight: '500', fontSize: FS, fontFamily: FONT }}>Select a folder with MP3 files</p>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
      {ctx.webfetchUrl && (
        <WebfetchOverlay
          url={ctx.webfetchUrl}
          content={ctx.webfetchContent}
          loading={ctx.webfetchLoading}
          onClose={ctx.closeWebfetch}
        />
      )}

      {/* Settings Modal */}
      {ctx.showSettings && (
        <SettingsModal
          musicRoot={ctx.configMusicRoot}
          outputFolder={ctx.configOutputFolder}
          outputMode={ctx.configOutputMode}
          saving={ctx.configSaving}
          onMusicRootChange={(v) => ctx.dispatch({ type: 'SET_CONFIG_MUSIC_ROOT', payload: v })}
          onOutputFolderChange={(v) => ctx.dispatch({ type: 'SET_CONFIG_OUTPUT_FOLDER', payload: v })}
          onOutputModeChange={(v) => ctx.dispatch({ type: 'SET_CONFIG_OUTPUT_MODE', payload: v })}
          onSave={ctx.saveConfig}
          onClearCache={ctx.clearCache}
          clearingCache={ctx.clearingCache}
          tagDefaults={ctx.tagEnabled}
          onTagDefaultsChange={(defaults) => ctx.dispatch({ type: 'SET_TAG_ENABLED', payload: defaults })}
          onClose={() => ctx.dispatch({ type: 'SET_SHOW_SETTINGS', payload: false })}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
