import { useEffect, useState, useRef, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { AppProvider, useAppContext } from './hooks/useAppContext';
import * as api from './api';
import { RefreshCw, Layout, Settings } from 'lucide-react';
import { FONT, FS, COLORS } from './components/styles';
import { parseCompilationTracklist } from './utils';
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

function AppContent() {
  const ctx = useAppContext();
  const [col1Width, setCol1Width] = useState(() => {
    const saved = localStorage.getItem('dgc-col1-width');
    return saved ? Number(saved) : 250;
  });
  const [col2Width, setCol2Width] = useState(() => {
    const saved = localStorage.getItem('dgc-col2-width');
    return saved ? Number(saved) : 340;
  });
  const isResizingCol1 = useRef(false);
  const isResizingCol2 = useRef(false);

  const saveCol1Width = useCallback((w: number) => { setCol1Width(w); localStorage.setItem('dgc-col1-width', String(w)); }, []);
  const saveCol2Width = useCallback((w: number) => { setCol2Width(w); localStorage.setItem('dgc-col2-width', String(w)); }, []);

  const onResizeCol1Start = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingCol1.current = true;
    const startX = e.clientX;
    const startWidth = col1Width;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingCol1.current) return;
      const delta = ev.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 150), 600);
      saveCol1Width(newWidth);
    };

    const onMouseUp = () => {
      isResizingCol1.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [col1Width]);

  const onResizeCol2Start = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingCol2.current = true;
    const startX = e.clientX;
    const startWidth = col2Width;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingCol2.current) return;
      const delta = ev.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 200), 800);
      saveCol2Width(newWidth);
    };

    const onMouseUp = () => {
      isResizingCol2.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [col2Width]);

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
    <div className="dashboard" style={{ display: 'flex', height: '100vh', backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: FONT }}>

      {/* Column 1: Library Tree */}
      <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', width: col1Width, flexShrink: 0, backgroundColor: COLORS.inputBgAlt, overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ fontSize: FS, fontWeight: '600', margin: 0, letterSpacing: '0.3px', fontFamily: FONT, color: COLORS.text }}>
            DGC TAGGER
          </h2>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="header-btn" onClick={ctx.collapseAll} title="Collapse all" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', fontSize: FS, fontWeight: '700', borderRadius: '4px', padding: '4px' }}>
              &#9650;
            </button>
            <button className="header-btn" onClick={() => ctx.dispatch({ type: 'SET_SHOW_SETTINGS', payload: true })} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', borderRadius: '4px', padding: '4px' }}>
              <Settings size={14} />
            </button>
            <button className="header-btn" onClick={ctx.fetchLibrary} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', borderRadius: '4px', padding: '4px' }}>
              <RefreshCw size={14} className={ctx.loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <LibraryTree
            tree={ctx.tree}
            selectedFolder={ctx.selectedFolder}
            expandedNodes={ctx.expandedNodes}
            onToggleNode={ctx.toggleNode}
            onSelectFolder={ctx.handleFolderSelect}
          />
        </div>
      </div>

      {/* Resize handle 1 */}
      <div
        className="resizer-vertical"
        onMouseDown={onResizeCol1Start}
      />

      {/* Column 2: Search */}
      <div style={{ display: 'flex', flexDirection: 'column', width: col2Width, flexShrink: 0, backgroundColor: COLORS.inputBgAlt, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
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
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
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

      {/* Resize handle 2 */}
      <div
        className="resizer-vertical"
        onMouseDown={onResizeCol2Start}
      />

      {/* Column 3: Main Content Area (Comparison & Tracks) */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', backgroundColor: COLORS.bg }}>
        <div className="diff-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
          {(ctx.selectedResult || ctx.localTags) ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', flex: '1 0 auto' }}>
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
                  <div style={{ marginTop: '10px', padding: '10px', background: COLORS.bg, borderRadius: '8px', border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: FS, color: COLORS.textDim, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontFamily: FONT }}>NOTES</div>
                    <p style={{ fontSize: FS, color: COLORS.textMuted, margin: 0, lineHeight: '1.5', fontFamily: FONT }}>{ctx.albumDetails.notes}</p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
                <ApplyPanel
                  onApplyTags={ctx.applyTags}
                  onCancel={() => ctx.clearSelectionState()}
                />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: COLORS.textInvisible, opacity: 0.5, flex: 1 }}>
              <Layout size={40} style={{ marginBottom: '10px' }} />
              <p style={{ fontWeight: '500', fontSize: FS, fontFamily: FONT }}>Select a folder with MP3 files</p>
            </div>
          )}
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
          enabledSources={ctx.enabledSources}
          onEnabledSourcesChange={(sources) => ctx.dispatch({ type: 'SET_ENABLED_SOURCES', payload: sources })}
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
