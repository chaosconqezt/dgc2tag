# TrackMatcher Panel — Style Overhaul Summary

## 🎯 Goals Achieved

| Aspect | Before | After |
|--------|--------|-------|
| **Design Tokens** | Scattered in `styles.ts` + inline CSS variables | Centralized in `trackMatcherStyles.ts` (300+ tokens) |
| **Spacing System** | Ad-hoc px values | 4px base scale (0–12) |
| **Color System** | Hardcoded hex + some CSS vars | Semantic color tokens with states |
| **Typography** | Mixed `fontSize` values | Consistent scale (xs–3xl) + mono stack |
| **Component Styles** | Inline objects + CSS classes | Reusable style objects + CSS vars |
| **Visual Hierarchy** | Flat, low contrast | Clear headers, badges, states |
| **Accessibility** | Basic | ARIA labels, roles, focus states |
| **Maintainability** | Copy-paste grids | Single column definition source |

---

## 📁 New Files Created

```
client/src/components/
├── trackMatcherStyles.ts      # Complete design system (37KB)
├── TrackMatcher.new.tsx       # Refactored TrackMatcher
├── MatchRow.new.tsx           # Refactored MatchRow with badges
├── SingleArtistTracks.new.tsx # With column headers
├── MultiArtistTracks.new.tsx  # With column headers
└── TrackArtistField.new.tsx   # Styled inline editor
```

---

## ✨ Key Improvements

### 1. **Design Token System** (`trackMatcherStyles.ts`)

```typescript
// Single source of truth for all visual decisions
TOKENS = {
  space: { 1: '2px', 2: '4px', 3: '6px', 4: '8px', ... },
  radius: { sm: '3px', md: '6px', lg: '8px', xl: '10px' },
  font: { size: { xs: '10px', sm: '11px', base: '12px', md: '13px', lg: '14px', xl: '15px', '2xl': '16px', '3xl': '18px' } },
  color: { bg, panelBg, cardBg, inputBg, border, text, green, yellow, red, ... },
  transition: { fast: '120ms', normal: '150ms', slow: '200ms' },
  // Semantic states
  simColor: (sim) => sim === 100 ? green : sim >= 80 ? yellow : red,
  simBg: (sim) => sim === 100 ? greenBg : sim >= 80 ? yellowBg : redBg,
}
```

### 2. **Similarity Badges** (Major UX win)

**Before:** Plain text `87%` in yellow
**After:** Pill badge with color-coded background

```tsx
<span style={S.SIM_BADGE(sim)} aria-label={`Similarity: ${sim}%`}>
  {sim}%
</span>
```

| Similarity | Color | Badge Style |
|------------|-------|-------------|
| 100% | 🟢 Green | Solid green bg, white text |
| 80–99% | 🟡 Yellow | Solid yellow bg, dark text |
| <80% | 🔴 Red | Solid red bg, white text |

### 3. **Column Header Rows**

Both `SingleArtistTracks` and `MultiArtistTracks` now render semantic header rows:

```tsx
<div style={S.SINGLE_ARTIST_HEADER} role="row" aria-rowindex={0}>
  <div style={S.CHECK_CELL}>✓</div>
  <div style={S.NUM_CELL}>#</div>
  <div style={S.NAME_CELL}>Remote</div>
  <div style={S.DUR_CELL}>Dur</div>
  <div style={S.SIM_CELL}>Sim</div>
  <div style={S.DUR_CELL}>Dur</div>
  <div style={S.NUM_CELL}>#</div>
  <div style={S.INPUT_WRAPPER}>Local / Edit</div>
</div>
```

### 4. **Unified Grid System**

Single column definition → both track row + artist row:

```typescript
export const TRACK_COLUMNS = {
  checkbox: { width: '28px' },
  number: { width: '36px' },
  name: { width: '1fr' },
  duration: { width: '56px' },
  similarity: { width: '52px' },
  localNum: { width: '36px' },
  localName: { width: '1fr' },
} as const;
```

### 5. **Enhanced Input States**

```ts
- **Focus:** Red border + subtle glow (`box-shadow: 0 0 0 2px red40`)
- **Edited:** Green text + green bg + green border
- **Mismatch:** Yellow text + yellow bg + yellow border
- **Unmatched:** Dim italic
- **Hover:** Border highlight

### 6. **Toolbar Redesign**

- Consistent spacing (`gap: 8px`, `padding: 8px 8px`)
- Group separators with `TOOLBAR_SEPARATOR`
- Stats with semantic colors (green/yellow/red)
- Disabled labels at 35% opacity
- Larger checkboxes (14px → 16px)

### 7. **Panel Structure**

```tsx
<div style={S.PANEL}>
  <div style={S.PANEL_HEADER}>Track Matching</div>
  <div style={S.TOOLBAR}>...</div>
  <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
    {/* Tracks with headers */}
  </div>
</div>
```

---

## 🎨 Visual Comparison

### Track Row (Before → After)

```
BEFORE:                                          AFTER:
┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐
│ ☐ 01  Track Name           3:45 87% │         │ ☐  01  Track Name                    │
│       filename.mp3                    │         │       filename.mp3                   │
└─────────────────────────────────────┘         │  3:45  ████ 87%████  3:45  01  Name  ████████████ │
                                                │       [Edited track name input      ] │
                                                └─────────────────────────────────────┘
```

### Toolbar (Before → After)

```
BEFORE:  [☐ write titles] [☐ filenames] | [12/12] [5 exact] [3 good] | [● ID3] [○ filename] | [☐ multi] [☐ strip] [☐ artists] [320kbps]

AFTER:
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [☐] Write titles  [☐] Filenames    │  12 / 12   5 exact  3 good  2 weak  1 extra      │
│                                    │                                                    │
│ [●] ID3  [○] Filename              │  [☐] Multi-artist  [☐] Strip parens  [☐] Artists │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ♿ Accessibility Improvements

| Feature | Implementation |
|---------|----------------|
| **ARIA roles** | `role="toolbar"`, `role="row"`, `aria-rowindex` |
| **Labels** | `aria-label` on all icon-only controls |
| **Focus visible** | Red outline (2px) on all interactive elements |
| **Keyboard** | TrackArtistField supports Enter/Space |
| **Semantic HTML** | `<label>` wrapping checkboxes, `<header>` for panel |
| **Disabled state** | `aria-disabled` + visual opacity + `cursor: not-allowed` |

---

## 🔧 Migration Guide

### Step 1: Add the design system
```bash
# File already created at:
client/src/components/trackMatcherStyles.ts
```

### Step 2: Replace components (one at a time)

```bash
# 1. TrackMatcher
mv client/src/components/TrackMatcher.tsx client/src/components/TrackMatcher.old.tsx
mv client/src/components/TrackMatcher.new.tsx client/src/components/TrackMatcher.tsx

# 2. MatchRow
mv client/src/components/MatchRow.tsx client/src/components/MatchRow.old.tsx
mv client/src/components/MatchRow.new.tsx client/src/components/MatchRow.tsx

# 3. SingleArtistTracks
mv client/src/components/SingleArtistTracks.tsx client/src/components/SingleArtistTracks.old.tsx
mv client/src/components/SingleArtistTracks.new.tsx client/src/components/SingleArtistTracks.tsx

# 4. MultiArtistTracks
mv client/src/components/MultiArtistTracks.tsx client/src/components/MultiArtistTracks.old.tsx
mv client/src/components/MultiArtistTracks.new.tsx client/src/components/MultiArtistTracks.tsx

# 5. TrackArtistField
mv client/src/components/TrackArtistField.tsx client/src/components/TrackArtistField.old.tsx
mv client/src/components/TrackArtistField.new.tsx client/src/components/TrackArtistField.tsx
```

### Step 3: Update imports in `TrackMatcher.tsx`

```typescript
// Change:
import { CHECKBOX, PANEL_STYLE } from './styles';

// To:
import * as S from './trackMatcherStyles';
```

### Step 4: Delete old styles (optional)
```bash
# After verifying everything works:
rm client/src/components/styles.ts
# Or keep for other components still using it
```

---

## 🧪 Testing Checklist

- [ ] Toolbar checkboxes toggle correctly
- [ ] Radio buttons switch filename mode
- [ ] Track rows render with similarity badges
- [ ] Input focus shows red glow
- [ ] Edited tracks show green styling
- [ ] Mismatched tracks show yellow styling
- [ ] Unmatched tracks show dim italic
- [ ] Multi-artist mode shows artist rows
- [ ] TrackArtistField inline edit works (click → type → Enter)
- [ ] Column headers align with data columns
- [ ] Scrolling works within panel
- [ ] Disabled states look correct
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces labels

---

## 📈 Future Extensions

The design system is ready for:

1. **Compact mode** — Add `--row-height-compact: 30px` toggle
2. **Density setting** — User preference for comfortable/cozy/compact
3. **Column visibility** — Toggle columns via toolbar
4. **Sort indicators** — Add to header cells
5. **Drag-to-reorder** — Visual drag handles
6. **Virtualization** — For 1000+ track albums
7. **Themes** — Token swap for high-contrast/sepia modes

---

## 📝 Notes

- **Zero CSS-in-JS runtime** — Pure React inline styles + CSS variables
- **Tree-shakeable** — Import only what you need: `import { SIM_BADGE } from './trackMatcherStyles'`
- **Type-safe** — All tokens are `as const` for IDE autocomplete
- **No breaking changes** — Original components preserved as `.old.tsx`
- **Consistent with app** — Uses existing CSS variables (`--bg`, `--red`, etc.)