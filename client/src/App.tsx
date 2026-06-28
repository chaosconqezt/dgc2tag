import { useEffect, useState, useRef, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { AppProvider, useAppContext } from './hooks/useAppContext';
import * as api from './api';
import { RefreshCw, Layout, Settings, BookOpen } from 'lucide-react';
import { parseCompilationTracklist, parseSingleArtistTracklist } from './utils';
import { WebfetchOverlay } from './components/WebfetchOverlay';
import { SettingsModal } from './components/SettingsModal';
import { ResultModal } from './components/ResultModal';
import { ProgressOverlay } from './components/ProgressOverlay';
import { LibraryTree } from './components/LibraryTree';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { TagComparison } from './components/TagComparison';
import { TrackMatcher } from './components/TrackMatcher';
import { ApplyPanel } from './components/ApplyPanel';
import { Footer } from './components/Footer';
import { LibraryView } from './components/LibraryView';

function AppContent() {
  const ctx = useAppContext();
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('dgc-sidebar-width');
    return saved ? Number(saved) : 320;
  });
  const [treeHeightPx, setTreeHeightPx] = useState(() => {
    const saved = localStorage.getItem('dgc-tree-height');
    return saved ? Number(saved) : 300;
  });
  const [cardSize, setCardSize] = useState(() => {
    const saved = localStorage.getItem('dgc-card-size');
    return saved ? Number(saved) : 150;
  });
  const [minAlbums, setMinAlbums] = useState(() => {
    const saved = localStorage.getItem('dgc-min-albums');
    return saved ? Number(saved) : 1;
  });
  const isResizing = useRef(false);
  const isResizingTree = useRef(false);

  const saveWidth = useCallback((w: number) => { setSidebarWidth(w); localStorage.setItem('dgc-sidebar-width', String(w)); document.documentElement.style.setProperty('--sidebar-width', w + 'px'); }, []);
  const saveTreeHeight = useCallback((h: number) => { setTreeHeightPx(h); localStorage.setItem('dgc-tree-height', String(h)); document.documentElement.style.setProperty('--tree-height', h + 'px'); }, []);
  const saveCardSize = useCallback((s: number) => { setCardSize(s); localStorage.setItem('dgc-card-size', String(s)); document.documentElement.style.setProperty('--card-size', s + 'px'); }, []);
  const saveMinAlbums = useCallback((n: number) => { setMinAlbums(n); localStorage.setItem('dgc-min-albums', String(n)); }, []);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = ev.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 200), 600);
      requestAnimationFrame(() => saveWidth(newWidth));
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);

  const onResizeTreeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingTree.current = true;
    const startY = e.clientY;
    const startH = treeHeightPx;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingTree.current) return;
      const delta = ev.clientY - startY;
      const newH = Math.min(Math.max(startH + delta, 80), 800);
      requestAnimationFrame(() => saveTreeHeight(newH));
    };

    const onMouseUp = () => {
      isResizingTree.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [treeHeightPx]);

  // Initialize CSS variables from saved state
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', sidebarWidth + 'px');
    document.documentElement.style.setProperty('--tree-height', treeHeightPx + 'px');
    document.documentElement.style.setProperty('--card-size', cardSize + 'px');
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      await ctx.fetchConfig();
      await ctx.fetchLibrary();
    };
    init().catch(console.error);
    return () => {
      api.cancelActiveRequests();
    };
  }, []);

  // Refresh library entries when switching to library view
  useEffect(() => {
    if (ctx.viewMode === 'library') {
      ctx.fetchLibraryEntries();
    }
  }, [ctx.viewMode]);

  return (
    <div className="dashboard">

      {ctx.viewMode === 'library' ? (<>
        {/* Library Mode — full width */}
        <div className="main-content">
          <div className="library-header">
            <div className="library-header-left">
              <button onClick={() => ctx.dispatch({ type: 'SET_VIEW_MODE', payload: 'main' })} className="toolbar-btn">
                <Layout size={14} />
              </button>
              <h2 className="library-header-title">
                LIBRARY
              </h2>
            </div>
            <div className="library-header-controls">
              <label className="library-control">
                <span className="library-control-label">Size</span>
                <input
                  type="range"
                  min={100}
                  max={280}
                  step={10}
                  value={cardSize}
                  onChange={(e) => saveCardSize(Number(e.target.value))}
                  className="library-range"
                />
                <span className="library-control-value">{cardSize}</span>
              </label>
              <label className="library-control">
                <span className="library-control-label">Min albums</span>
                <div className="library-radio-group">
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      className={`library-radio-btn${minAlbums === n ? ' active' : ''}`}
                      onClick={() => saveMinAlbums(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </label>
            </div>
          </div>
          <LibraryView entries={ctx.libraryEntries} cardSize={cardSize} minAlbums={minAlbums} />
        </div>
      </>) : (<>
      {/* Sidebar: Library Tree + Search Results */}
      <div className="sidebar">
        <div className="sidebar-inner">
          <div className="library-header">
            <div className="library-header-left">
              <button onClick={() => ctx.dispatch({ type: 'SET_VIEW_MODE', payload: 'library' })} className="toolbar-btn">
                <BookOpen size={14} />
              </button>
              <h2>
                DGC TAGGER
              </h2>
            </div>
            <div className="sidebar-controls">
              <button onClick={ctx.collapseAll} className="toolbar-btn collapse-btn" title="Collapse all">
                &#9650;
              </button>
              <button onClick={() => ctx.dispatch({ type: 'SET_SHOW_SETTINGS', payload: true })} className="toolbar-btn">
                <Settings size={14} />
              </button>
              <button onClick={ctx.fetchLibrary} className="toolbar-btn">
                <RefreshCw size={14} className={ctx.loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <div className="sidebar-tree">
            <LibraryTree
              tree={ctx.tree}
              selectedFolder={ctx.selectedFolder}
              expandedNodes={ctx.expandedNodes}
              onToggleNode={ctx.toggleNode}
              onSelectFolder={ctx.handleFolderSelect}
              onRename={ctx.renameNode}
              onDelete={ctx.deleteNode}
              onMove={ctx.moveNode}
            />
          </div>

          {/* Resize handle: tree ↔ matches */}
          <div
            onMouseDown={onResizeTreeStart}
            className="resize-handle row"
          />

          {/* Search Results — vertical list */}
          <div className="sidebar-results">
            <SearchResults
              results={ctx.searchResults}
              deezerResults={ctx.deezerResults}
              mbrainzResults={ctx.mbrainzResults}
              bandcampResults={ctx.bandcampResults}
              dgcLoading={ctx.dgcLoading}
              deezerLoading={ctx.deezerLoading}
              mbrainzLoading={ctx.mbrainzLoading}
              bandcampLoading={ctx.bandcampLoading}
              searchTimeMs={ctx.searchTimeMs}
              selectedResult={ctx.selectedResult}
              onSelectResult={ctx.handleSelectResult}
              onSelectDeezer={ctx.handleSelectDeezer}
              selectedDeezerId={ctx.selectedDeezer?.albumId ?? null}
              selectedMbrainzId={ctx.selectedMbrainz?.releaseId ?? null}
              onSelectMbrainz={ctx.handleSelectMbrainz}
            />
          </div>
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="resize-handle col"
      />

      {/* Main Content Area */}
      <div className="main-content">

        {/* Content Split: Comparison Panel */}
        <div className="bottom-panels">

          {/* Comparison Panel */}
          <div className="diff-panel">

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

            {/* Apply buttons */}
            <ApplyPanel
              onApplyTags={ctx.applyTags}
              onCancel={() => ctx.clearSelectionState()}
            />

            {(ctx.selectedResult || ctx.localTags) ? (
              <div>
                <TagComparison
                  selectedResult={ctx.selectedResult}
                  localTags={ctx.localTags}
                  tagEnabled={ctx.tagEnabled}
                  editedSiteValues={ctx.editedSiteValues}
                  editedExtraTags={ctx.editedExtraTags}
                  stripRemoteParentheses={ctx.stripRemoteParentheses}
                  onTagEnabledChange={(key, enabled) => ctx.dispatch({ type: 'SET_TAG_ENABLED_KEY', payload: { key, enabled } })}
                  onEditedSiteValuesChange={(key, value) => ctx.dispatch({ type: 'SET_EDITED_SITE_VALUE', payload: { key, value } })}
                  onEditedExtraTagChange={(key, value) => ctx.dispatch({ type: 'SET_EDITED_EXTRA_TAG', payload: { key, value } })}
                  onClearAllExtraTags={(keys) => ctx.dispatch({ type: 'CLEAR_ALL_EXTRA_TAGS', payload: keys })}
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
                  onTrackNameEnabledBatchChange={(nums, enabled) => ctx.dispatch({ type: 'SET_TRACK_NAME_ENABLED_BATCH', payload: { nums, enabled } })}
                  onTrackArtistsEnabledChange={(num, enabled) => ctx.dispatch({ type: 'SET_TRACK_ARTISTS_ENABLED', payload: { num, enabled } })}
                  onTrackArtistsEnabledBatchChange={(nums, enabled) => ctx.dispatch({ type: 'SET_TRACK_ARTISTS_ENABLED_BATCH', payload: { nums, enabled } })}
                  onEditedTrackNameChange={(num, value) => ctx.dispatch({ type: 'SET_EDITED_TRACK_NAME', payload: { num, value } })}
                  onEditedTrackArtistChange={(num, value) => ctx.dispatch({ type: 'SET_EDITED_TRACK_ARTIST', payload: { num, value } })}
                  onCompilationChange={(enabled) => {
                    ctx.dispatch({ type: 'SET_COMPILATION', payload: enabled });
                    if (ctx.albumDetails?.tracklist) {
                      if (enabled) {
                        const parsed = parseCompilationTracklist(ctx.albumDetails.tracklist);
                        ctx.dispatch({ type: 'SET_ALBUM_DETAILS', payload: { ...ctx.albumDetails, parsedTracks: parsed } });
                      } else {
                        const parsed = parseSingleArtistTracklist(ctx.albumDetails.tracklist);
                        ctx.dispatch({ type: 'SET_ALBUM_DETAILS', payload: { ...ctx.albumDetails, parsedTracks: parsed } });
                      }
                    }
                  }}
                />

                {ctx.albumDetails?.notes && (
                  <div className="notes-panel">
                    <div className="notes-label">NOTES</div>
                    <p className="notes-text">{ctx.albumDetails.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <Layout size={40} />
                <p>Select a folder with MP3 files</p>
                <p className="empty-state-hint">Click a folder in the tree on the left</p>
              </div>
            )}
          </div>
        </div>
        <Footer
          musicRoot={ctx.configMusicRoot}
          outputFolder={ctx.configOutputFolder}
          outputMode={ctx.configOutputMode}
          onMusicRootChange={(v) => ctx.dispatch({ type: 'SET_CONFIG_MUSIC_ROOT', payload: v })}
          onOutputFolderChange={(v) => ctx.dispatch({ type: 'SET_CONFIG_OUTPUT_FOLDER', payload: v })}
          onOutputModeChange={(v) => ctx.dispatch({ type: 'SET_CONFIG_OUTPUT_MODE', payload: v })}
          onSave={ctx.saveConfig}
        />
      </div>
      </>)}
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
          saving={ctx.configSaving}
          onSave={ctx.saveConfig}
          onClearCache={ctx.clearCache}
          clearingCache={ctx.clearingCache}
          tagDefaults={ctx.tagEnabled}
          onTagDefaultsChange={(defaults) => ctx.dispatch({ type: 'SET_TAG_ENABLED', payload: defaults })}
          enabledSources={ctx.enabledSources}
          onEnabledSourcesChange={(sources) => ctx.dispatch({ type: 'SET_ENABLED_SOURCES', payload: sources })}
          cleanupIgnorePatterns={ctx.cleanupIgnorePatterns}
          onCleanupIgnorePatternsChange={(patterns) => ctx.dispatch({ type: 'SET_CLEANUP_IGNORE_PATTERNS', payload: patterns })}
          onClose={() => ctx.dispatch({ type: 'SET_SHOW_SETTINGS', payload: false })}
        />
      )}
      {ctx.resultModal && (
        <ResultModal
          success={ctx.resultModal.success}
          message={ctx.resultModal.message}
          details={ctx.resultModal.details}
          onClose={() => ctx.dispatch({ type: 'SET_RESULT_MODAL', payload: null })}
        />
      )}
      {ctx.progress?.active && (
        <ProgressOverlay
          phase={ctx.progress.phase}
          current={ctx.progress.current}
          total={ctx.progress.total}
          log={ctx.progress.log}
          done={ctx.progress.done}
          success={ctx.progress.success}
          message={ctx.progress.message}
          details={ctx.progress.details}
          onClose={() => ctx.dispatch({ type: 'SET_PROGRESS', payload: null })}
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
