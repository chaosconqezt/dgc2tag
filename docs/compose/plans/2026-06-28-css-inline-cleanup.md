# CSS Inline Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all `style={{...}}` inline styles from JSX components, replacing them with CSS classes in `index.css`, and delete `styles.ts` when no longer imported.

**Architecture:** CSS variables in `:root` for theming. CSS classes for layout/components. data-attributes for dynamic states. Only dynamic values (computed widths, selected accent colors) may remain as inline `style`.

**Tech Stack:** React 19, TypeScript, Vite 8, CSS custom properties

---

## Current State Audit

### What's Done ( Groups 1–3 + Base )
| Group | Status | Notes |
|-------|--------|-------|
| 1: Sidebar | ✅ | App.tsx sidebar section, LibraryTree.tsx, MoveDialog.tsx |
| 2: Library | ✅ | LibraryView.tsx, GenreCloud.tsx, LibraryTree.tsx |
| 3: Result Cards | ✅ | ResultCard.tsx (3 dynamic inline remain — accent color, acceptable) |
| Base: CSS vars | ✅ | `:root` vars, body reset, utility classes |

### What's Remaining ( Inline style counts )
| File | Inline Count | Priority | Notes |
|------|-------------|----------|-------|
| `TagComparison.tsx` | 59 | HIGH | ⚠️ Table with input fields. Needs prototype first. |
| `TrackMatcher.tsx` | 30 | HIGH | ⚠️ Table with input fields. Same style as TagComparison. |
| `SettingsModal.tsx` | 30 | HIGH | Modal, form fields, toggles |
| `FolderPicker.tsx` | 18 | MED | Tree-like folder selector |
| `MatchRow.tsx` | 16 | MED | Track match row, sim colors |
| `Footer.tsx` | 15 | MED | Bottom bar with status |
| `SearchResults.tsx` | 15 | MED | Results container, tabs |
| `MultiArtistTracks.tsx` | 12 | MED | Track list wrapper |
| `WebfetchOverlay.tsx` | 11 | LOW | Webfetch modal |
| `SearchBar.tsx` | 10 | LOW | Search input area |
| `ApplyPanel.tsx` | 5 | LOW | Apply button area |
| `ErrorBoundary.tsx` | 5 | LOW | Error display |
| `TrackArtistField.tsx` | 3 | LOW | Inline artist input |
| `ContextMenu.tsx` | 2 | LOW | Right-click menu |
| `ResultModal.tsx` | 5 | LOW | Already uses progress-overlay classes, minor cleanup |
| `ProgressOverlay.tsx` | 1 | DONE | Single dynamic `style={{ width }}` for progress bar — acceptable |
| `ResultCard.tsx` | 3 | DONE | Dynamic accent color — acceptable |
| `LibraryTree.tsx` | 2 | DONE | Dynamic padding — acceptable |
| `LibraryView.tsx` | 1 | DONE | Dynamic card size var — acceptable |
| `GenreCloud.tsx` | 1 | DONE | Dynamic font size — acceptable |

### styles.ts Dependencies (19 files import it)
Most used: `COLORS` (17 files), `FONT` (13), `FS` (13)
Single-use exports: `LABEL_STYLE`, `MODAL_INPUT_STYLE`, `HINT_STYLE`, `ROW_STYLE`, `GRID_STYLE`, `CELL_STYLE`, `PERCENT_STYLE`

---

## Global Constraints

1. Never touch `value`, `onChange`, `onBlur`, `onKeyDown`, `readOnly`, `disabled`, `checked` props
2. Never add `pointer-events: none`
3. Never change DOM nesting around `<input>` or `<button>`
4. After each component replacement — verify functionality
5. Only ONE group per commit
6. Dynamic values (computed widths, selected accent colors) may remain as inline `style={{ '--accent': color }}`

---

## Task 1: CSS Foundation — Utility Classes + Panel Classes

**Covers:** Groups 4.1, 4.2 foundation

**Files:**
- Modify: `client/src/index.css`

**What to add:**

```css
/* ─── Utility classes ────────────────── */
.row { display: flex; }
.col { display: flex; flex-direction: column; }
.flex-1 { flex: 1; }
.shrink-0 { flex-shrink: 0; }
.gap-xs { gap: var(--gap-xs); }
.gap-sm { gap: var(--gap-sm); }
.gap-md { gap: var(--gap-md); }
.gap-lg { gap: var(--gap-lg); }
.gap-xl { gap: var(--gap-xl); }
.p-sm { padding: var(--gap-sm); }
.p-md { padding: var(--gap-md); }
.p-lg { padding: var(--gap-lg); }
.p-xl { padding: var(--gap-xl); }
.mb-sm { margin-bottom: var(--gap-sm); }
.mb-md { margin-bottom: var(--gap-md); }
.mb-lg { margin-bottom: var(--gap-lg); }

/* ─── Panel / Modal classes ──────────── */
.panel {
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.cell {
  padding: 3px 6px;
  border-radius: 3px;
  font-size: var(--fs);
  border: 1px solid var(--border-light);
  background: var(--input-bg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.percent {
  text-align: center;
  font-size: var(--fs);
  font-weight: var(--fw-bold);
  font-family: var(--font-mono);
  min-width: 40px;
}
.label-uppercase {
  display: block;
  font-size: var(--fs);
  color: var(--text-dim);
  font-weight: var(--fw-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}
.hint {
  font-size: var(--fs);
  color: var(--text-disabled);
  margin-top: 4px;
}
.cb {
  accent-color: var(--accent);
  width: 11px;
  height: 11px;
  cursor: pointer;
}
```

- [ ] **Step 1:** Add utility + panel classes to `index.css`
- [ ] **Step 2:** Run `npx tsc --noEmit --project client/tsconfig.json` — verify no TS errors
- [ ] **Step 3:** Commit: `feat(css): add utility and panel foundation classes`

---

## Task 2: SearchResults.tsx — Inline → CSS

**Covers:** Group 4.3

**Files:**
- Modify: `client/src/components/SearchResults.tsx`

**Steps:**
- [ ] Read file, identify all `style={{` usages
- [ ] For each: if static → create CSS class in index.css; if dynamic (computed value) → keep inline
- [ ] Remove `import { ... } from './styles'` if no longer needed
- [ ] Verify: tabs switch, results render, loading states work
- [ ] Run tsc, commit

---

## Task 3: SearchBar.tsx — Inline → CSS

**Covers:** Group 4.4

**Files:**
- Modify: `client/src/components/SearchBar.tsx`

**Steps:**
- [ ] Read file, identify all `style={{` usages
- [ ] Create CSS classes: `.search-bar`, `.search-input`, `.search-actions`, `.search-toggle`
- [ ] Replace inline with classes
- [ ] Remove styles.ts import if possible
- [ ] Verify: search works, toggles work, keyboard shortcuts work
- [ ] Run tsc, commit

---

## Task 4: Footer.tsx — Inline → CSS

**Covers:** Group 4.5

**Files:**
- Modify: `client/src/components/Footer.tsx`

**Steps:**
- [ ] Read file, identify all `style={{` usages
- [ ] Create CSS classes: `.footer`, `.footer-status`, `.footer-actions`
- [ ] Replace inline with classes
- [ ] Remove styles.ts import if possible
- [ ] Verify: status displays, buttons work
- [ ] Run tsc, commit

---

## Task 5: FolderPicker.tsx — Inline → CSS

**Covers:** Group 4.6

**Files:**
- Modify: `client/src/components/FolderPicker.tsx`

**Steps:**
- [ ] Read file, identify all `style={{` usages
- [ ] Create CSS classes: `.folder-picker`, `.folder-item`, `.folder-selected`, `.folder-icon`
- [ ] Replace inline with classes
- [ ] Remove styles.ts import if possible
- [ ] Verify: folder selection works, navigation works
- [ ] Run tsc, commit

---

## Task 6: SingleArtistTracks.tsx — Inline → CSS

**Covers:** Groups 4.7, 5.3

**Files:**
- Modify: `client/src/components/SingleArtistTracks.tsx`

**Steps:**
- [ ] Read file, identify all `style={{` usages
- [ ] Create CSS classes for track list container
- [ ] Replace `simColor(m.sim)` with CSS classes `.sim-high`, `.sim-mid`, `.sim-low`
- [ ] Remove styles.ts import
- [ ] Verify: track list renders, sim colors correct
- [ ] Run tsc, commit

---

## Task 7: TrackArtistField.tsx — Inline → CSS

**Covers:** Group 4.8

**Files:**
- Modify: `client/src/components/TrackArtistField.tsx`

**Steps:**
- [ ] Read file, identify all `style={{` usages
- [ ] Create CSS class: `.track-artist-input`
- [ ] Replace inline with class
- [ ] Remove styles.ts import if possible
- [ ] Verify: artist editing works
- [ ] Run tsc, commit

---

## Task 8: ApplyPanel.tsx — Inline → CSS

**Covers:** Group 4.9

**Files:**
- Modify: `client/src/components/ApplyPanel.tsx`

**Steps:**
- [ ] Read file, identify all `style={{` usages
- [ ] Create CSS classes: `.apply-panel`, `.apply-actions`
- [ ] Replace inline with classes
- [ ] Remove styles.ts import if possible
- [ ] Verify: apply buttons work, mode selection works
- [ ] Run tsc, commit

---

## Task 9: ErrorBoundary.tsx — Inline → CSS

**Covers:** Group 4.10

**Files:**
- Modify: `client/src/components/ErrorBoundary.tsx`

**Steps:**
- [ ] Read file, identify all `style={{` usages
- [ ] Create CSS classes: `.error-boundary`, `.error-message`, `.error-stack`
- [ ] Replace inline with classes
- [ ] Remove styles.ts import if possible
- [ ] Verify: error display renders correctly
- [ ] Run tsc, commit

---

## Task 10: ContextMenu.tsx — Inline → CSS

**Covers:** Group 4.11

**Files:**
- Modify: `client/src/components/ContextMenu.tsx`

**Steps:**
- [ ] Read file, identify all `style={{` usages
- [ ] Create CSS classes: `.context-menu`, `.context-menu-item`, `.context-menu-separator`
- [ ] Replace inline with classes
- [ ] Remove styles.ts import if possible
- [ ] Verify: right-click menu appears, items clickable
- [ ] Run tsc, commit

---

## Task 11: WebfetchOverlay.tsx — Inline → CSS

**Covers:** Group 4.14

**Files:**
- Modify: `client/src/components/WebfetchOverlay.tsx`

**Steps:**
- [ ] Read file, identify all `style={{` usages
- [ ] Create CSS classes: `.webfetch-overlay`, `.webfetch-panel`, `.webfetch-content`
- [ ] Replace inline with classes
- [ ] Remove styles.ts import if possible
- [ ] Verify: overlay opens/closes, content loads
- [ ] Run tsc, commit

---

## Task 12: simColor → CSS Classes (Groups 5.1–5.4)

**Covers:** Groups 5.1, 5.2, 5.3, 5.4

**Files:**
- Modify: `client/src/index.css` (add `.sim-high`, `.sim-mid`, `.sim-low`)
- Modify: `client/src/components/MatchRow.tsx`
- Modify: `client/src/components/SingleArtistTracks.tsx`
- Modify: `client/src/components/MultiArtistTracks.tsx`

**Steps:**
- [ ] Add to index.css:
  ```css
  .sim-high { color: var(--green); }
  .sim-mid { color: var(--yellow); }
  .sim-low { color: var(--red); }
  ```
- [ ] MatchRow.tsx: replace `simColor(m.sim)` with className ternary
- [ ] SingleArtistTracks.tsx: same replacement, remove simColor import
- [ ] MultiArtistTracks.tsx: same replacement, remove simColor import
- [ ] Verify: sim colors match (green/yellow/red)
- [ ] Run tsc, commit

---

## Task 13: Table Style Prototype — Visual Design

**Covers:** Groups 6.0, 11.0 (prerequisite for TagComparison + TrackMatcher)

**⚠️ WHY:** TagComparison (59 inline) and TrackMatcher (30 inline) are tables with input fields. They must share a unified style. Input fields can break easily — we need a standalone prototype to work out the visual BEFORE touching the real components.

**Files:**
- Create: `client/src/table-prototype.html` (temporary, deleted after Task 15)

**What to prototype (all variations in one HTML file):**
```html
<!-- Table row variations -->
<div class="table-row">
  <span class="table-label">Artist</span>
  <input class="table-input" value="Cannibal Corpse" />
</div>

<div class="table-row" data-enabled="false">
  <span class="table-label">Album</span>
  <input class="table-input" value="Tomb of the Mutilated" />
</div>

<div class="table-row">
  <span class="table-label">Year</span>
  <input class="table-input" data-diff="true" value="1992" />
</div>

<div class="table-row">
  <span class="table-label">Genre</span>
  <input class="table-input" data-readonly="true" value="Death Metal" />
</div>

<!-- Section header -->
<div class="table-section-header">TRACK TITLES</div>

<!-- Track row with checkbox -->
<div class="table-row">
  <input type="checkbox" class="cb" checked />
  <span class="table-label">01</span>
  <input class="table-input" data-diff="true" value=" Hammer Smashed Face" />
  <span class="table-percent">92%</span>
</div>

<!-- Multiline (Extra Tags) -->
<div class="table-row">
  <span class="table-label">Notes</span>
  <textarea class="table-textarea" rows="3"></textarea>
</div>
```

**Steps:**
- [ ] Create `table-prototype.html` with all row/input/section variations
- [ ] Add CSS classes to index.css: `.table-row`, `.table-label`, `.table-input`, `.table-textarea`, `.table-percent`, `.table-section-header`, data-attribute variants
- [ ] Open in browser, iterate on visual until满意
- [ ] Note: do NOT touch any .tsx files yet — pure CSS work
- [ ] Commit: `feat(css): table style prototype for TagComparison + TrackMatcher`

---

## Task 14: TagComparison.tsx — Apply Table Style (Group 6)

**Covers:** Groups 6.1, 6.2

**⚠️ CRITICAL:** Input fields — never touch value/onChange/onBlur/onKeyDown. Only replace `style={{...}}` with `className`. After each replacement, verify the input still works.

**Files:**
- Modify: `client/src/components/TagComparison.tsx`
- Verify against: `client/src/table-prototype.html` (visual reference)

**Steps:**
- [ ] Read TagComparison.tsx, map each `style={{` to the corresponding table class from prototype
- [ ] Replace inline styles with table classes + data-attributes
- [ ] Remove styles.ts import
- [ ] Verify EVERY input field: click, type, tab, readonly, diff highlighting
- [ ] Verify: enabled checkbox, section headers, Extra Tags textarea
- [ ] Run tsc, commit

---

## Task 15: MatchRow.tsx + TrackMatcher.tsx — Apply Table Style (Groups 7, 11)

**Covers:** Groups 7.1, 7.2, 11.0, 11.1

**⚠️ CRITICAL:** Same rules as Task 14 — input fields are fragile.

**Files:**
- Modify: `client/src/components/MatchRow.tsx`
- Modify: `client/src/components/TrackMatcher.tsx`

**Steps:**
- [ ] MatchRow.tsx: replace 16 inline styles with table classes
- [ ] TrackMatcher.tsx: replace 30 inline styles with table classes
- [ ] Verify: track name input, sim colors, checkboxes, filename mode toggle
- [ ] Run tsc, commit

---

## Task 16: Delete Prototype — Cleanup

**Covers:** Post-prototype cleanup

**Files:**
- Delete: `client/src/table-prototype.html`

**Steps:**
- [ ] Verify TagComparison and TrackMatcher look correct (match prototype)
- [ ] Delete `table-prototype.html`
- [ ] Commit: `chore: remove table prototype, styles applied to TagComparison + TrackMatcher`

---

## Task 17: MultiArtistTracks.tsx — Inline → CSS (Group 8)

**Covers:** Group 8.1

**Files:**
- Modify: `client/src/components/MultiArtistTracks.tsx`

**Steps:**
- [ ] Read file, identify all `style={{` usages
- [ ] Create CSS classes for multi-artist track list
- [ ] Replace inline with classes
- [ ] Remove styles.ts import if possible
- [ ] Verify: artist field, checkboxes work
- [ ] Run tsc, commit

---

## Task 18: SettingsModal.tsx — Inline → CSS (Group 9)

**Covers:** Group 9.1

**Files:**
- Modify: `client/src/components/SettingsModal.tsx`

**Steps:**
- [ ] Read file, identify all 30 `style={{` usages
- [ ] Create CSS classes: `.settings-overlay`, `.settings-panel`, `.settings-section`, `.settings-row`, `.settings-label`, `.settings-toggle`, `.settings-input`
- [ ] Replace inline with classes
- [ ] Remove styles.ts import
- [ ] Verify: all toggles, pattern input, buttons work
- [ ] Run tsc, commit

---

## Task 19: App.tsx — Remaining Inline (Group 10)

**Covers:** Group 10.1

**Files:**
- Modify: `client/src/App.tsx`

**Steps:**
- [ ] Read file, identify remaining `style={{` usages
- [ ] Create CSS classes for main panel layout, content areas
- [ ] Replace inline with classes (keep only dynamic values like computed widths)
- [ ] Remove styles.ts import if possible
- [ ] Verify: entire flow end-to-end
- [ ] Run tsc, commit

---

## Task 20: Final Cleanup — Delete styles.ts

**Covers:** Groups 11.0, 11.1

**Files:**
- Delete: `client/src/components/styles.ts`
- Modify: all files that still import from `./styles`

**Steps:**
- [ ] Search for remaining `import { ... } from './styles'` across all files
- [ ] For each remaining import: replace with CSS class or CSS variable reference
- [ ] Delete `styles.ts`
- [ ] Run tsc — verify zero errors
- [ ] Run full app test — verify all functionality
- [ ] Commit: `feat(css): remove styles.ts, all styles now in index.css`

---

## Task 21: Regression Test

**Covers:** Full verification

**Steps:**
- [ ] Run `npx tsc --noEmit --project client/tsconfig.json` — zero errors
- [ ] Manual test: sidebar tree (expand, collapse, rename, move, delete, context menu)
- [ ] Manual test: library view (cards, genre filter, alphabetical nav, owned border)
- [ ] Manual test: search (DGC, Deezer, MusicBrainz, Bandcamp results)
- [ ] Manual test: tag comparison (enabled/disabled, diff highlighting, readonly)
- [ ] Manual test: track matching (single/multi artist, sim colors, filename mode)
- [ ] Manual test: apply (write, rename, move modes, progress overlay, diff display)
- [ ] Manual test: settings modal, folder picker, error boundary
- [ ] Verify: zero `style={{` in any component (grep check)
- [ ] Verify: zero imports from `./styles` (grep check)
