# Glyph Forge — Design Document

## Concept
A fast-paced puzzle game where you're a runesmith inscribing magical glyphs on a stone tablet. Rune fragments drift in and you rotate/place them to complete full glyphs. Completed glyphs score points and repair cracks. Incomplete fragments decay and crack the tablet. The tablet shatters when cracks reach critical mass.

## Art Style: Chibi (32-56px)
Chosen for readability at puzzle-game scale — needs to be instantly clear what each piece is while keeping a mystical atmosphere. Warm stone backdrop with glowing rune lines.

## Core Mechanics

### Grid
- 8 columns × 12 rows stone tablet
- Each cell is 48×48px rendered

### Rune Fragments
- Fragments are tetromino-like shapes (2-4 cells) but each cell contains a partial glyph stroke
- 5 fragment types: Arc, Line, Angle, Cross, Dot — each draws a different stroke portion
- Fragments have an element (Fire/Water/Earth/Air) shown by colour

### Glyph Completion
- When a 2×2 area contains all 4 required stroke types, it completes a glyph
- Completed glyph flares with elemental colour, cells clear, score awarded
- Adjacent cells get crack repair

### Elemental Chains
- Completing same-element glyphs in sequence builds a combo multiplier (×2, ×3, ×4...)
- Breaking the chain (different element) triggers a "Fusion Burst" — clears all cracking tiles
- Strategic tension: chase combos for score vs mix elements for safety

### Decay & Cracking
- Fragments that sit for 8 seconds without completing a glyph begin to crack
- Cracked cells spread to neighbours over time (3 second intervals)
- 60% of cells cracked = tablet shatters (game over)
- Completed glyphs repair cracks in a 3×3 radius

### Scoring
- Base glyph: 100 points
- Chain multiplier: ×2, ×3, ×4...
- Fusion burst bonus: 50 per cracked tile cleared
- Speed bonus: complete glyph within 3 seconds of fragment placement

### Difficulty Progression
- Fragment drop interval: starts at 4s, decreases by 0.1s every 30 seconds, min 1.5s
- Crack spread speed increases after 2 minutes
- After 3 minutes: "Void fragments" appear (wildcards that match any element but crack faster)

## Controls

### Keyboard
- Left/Right arrows: move fragment horizontally
- Up arrow: rotate fragment 90°
- Down arrow: soft drop (faster descent)
- Space: hard drop (instant placement)
- P: pause

### Mobile Touch
- Swipe left/right: move fragment
- Tap: rotate
- Swipe down: soft drop
- Double tap: hard drop

## Visual Entities

### 1. Stone Tablet Background
- **Size**: 384×576 (8×12 grid of 48px cells)
- **Description**: Weathered grey stone with subtle grain texture. Faint grid lines etched into surface. Darker at edges (vignette). Visible chisel marks.
- **Palette**: 5 greys from #2a2a30 (deep shadow) to #8a8890 (highlight) with warm undertone

### 2. Rune Fragment — Arc
- **Size**: 48×48 per cell
- **Description**: Curved glowing stroke, like the arc of a circle. Bright centre line with softer glow falloff. Element colour determines hue.
- **Palette per element**:
  - Fire: #ff6b35 → #ffa066 → #ffcc88 (core to glow)
  - Water: #3388cc → #55aaee → #88ccff
  - Earth: #66aa44 → #88cc66 → #aaee88
  - Air: #aa88dd → #ccaaff → #eeccff

### 3. Rune Fragment — Line
- **Size**: 48×48 per cell
- **Description**: Straight vertical or horizontal glowing stroke. Clean geometric line with glow.
- **Palette**: Same elemental palettes as Arc

### 4. Rune Fragment — Angle
- **Size**: 48×48 per cell
- **Description**: 90-degree corner stroke. Two lines meeting at a point. Sharp corner with bright vertex.
- **Palette**: Same elemental palettes

### 5. Rune Fragment — Cross
- **Size**: 48×48 per cell
- **Description**: Small cross/plus shape. Intersection point is brightest. Short arms.
- **Palette**: Same elemental palettes

### 6. Rune Fragment — Dot
- **Size**: 48×48 per cell
- **Description**: Concentrated point of energy. Bright centre, circular glow falloff. Pulses gently.
- **Palette**: Same elemental palettes

### 7. Completed Glyph Effect
- **Size**: 96×96 (covers 2×2 cells)
- **Description**: Full glyph symbol combining all strokes into a coherent mystical symbol. Bright flash on completion, then fades as cells clear. Each element has a distinct glyph shape.

### 8. Crack Overlay
- **Size**: 48×48 per cell
- **Description**: Dark jagged lines spreading across stone surface. Starts as hairline, grows wider/darker with age. Orange-red glow in deepest cracks (heat underneath).
- **Palette**: #1a1a1a (crack line), #442211 (edge), #ff4422 (deep glow)

### 9. Fusion Burst Effect
- **Description**: Expanding ring of white-gold energy from the completed glyph position. Particles scatter outward. Cracked tiles flash white then repair.
- **Palette**: #ffffff, #ffdd88, #ffaa44

### 10. Element Icons (UI)
- **Size**: 24×24 each
- **Description**: Small icons showing current chain element and multiplier. Fire = flame, Water = droplet, Earth = leaf, Air = spiral.
- **Palette**: Matching element palettes

### 11. Tablet Border
- **Size**: Frame around the grid
- **Description**: Ornate stone frame with carved rune symbols at corners. Darker, more detailed stone than the playing field. Corner symbols glow faintly with element colours.
- **Palette**: #1a1a22 to #555560, gold accent #aa8844

## UI Layout
```
┌──────────────────────────────────┐
│  GLYPH FORGE          SCORE: 0  │
│ ┌──────────┐  ┌──────┐          │
│ │          │  │ NEXT │          │
│ │          │  │      │          │
│ │  TABLET  │  └──────┘          │
│ │  8 × 12  │  CHAIN: ×1        │
│ │          │  [element icon]    │
│ │          │  ──────            │
│ │          │  CRACKS: 12%      │
│ │          │  ████░░░░░░       │
│ └──────────┘                    │
└──────────────────────────────────┘
```

## Sound Effects (Web Audio)
- Fragment place: low stone thud
- Rotate: quick click
- Glyph complete: ascending chime + sizzle
- Chain multiplier up: higher-pitched chime
- Fusion burst: deep boom + shimmer
- Crack spread: quiet crumble
- Tablet shatter: dramatic crack/break
- Background: low ambient hum that intensifies with crack percentage
