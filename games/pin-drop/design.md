# Pin Drop - Design Document

## Concept
A geography guessing game where players are shown a series of visual and textual clues about a mystery location somewhere on Earth. They must drop a pin on a world map to guess where it is. Closer guesses earn more points. 5 rounds per game.

Inspired by geography guessing games, but with a unique clue-based presentation rather than street-view imagery. The game tests geographic knowledge through layered hints: landscape type, cultural details, climate, landmarks, and fun facts.

## Core Mechanics

### Round Flow
1. A "postcard" panel appears showing clues about the mystery location
2. Clues are revealed progressively (3 tiers): first a vague hint, then more specific, then very specific
3. Player can guess at any time by clicking/tapping the world map
4. Earlier guesses (fewer clues revealed) earn a score multiplier bonus
5. After guessing, the actual location is revealed with a line showing the distance
6. Score = max(0, 5000 - distance_km) * clue_multiplier

### Clue Tiers
- Tier 1 (3x multiplier): Vague - continent hint, landscape type, climate
- Tier 2 (2x multiplier): Medium - cultural details, language, nearby features
- Tier 3 (1x multiplier): Specific - landmark name, country, distinctive detail

### Scoring
- Perfect (< 50km): 5000 * multiplier
- Close (< 150km): 4000-5000 * multiplier
- Good (< 500km): 3000-4000 * multiplier
- OK (< 1500km): 1000-3000 * multiplier
- Far (< 5000km): 100-1000 * multiplier
- Way off (> 5000km): 0-100 * multiplier
- Max possible per round: 15,000 (perfect guess on tier 1)
- Max possible per game: 75,000

### Location Database
50+ handcrafted locations spanning all continents with 3-tier clue sets:
- Major world cities (Paris, Tokyo, Cairo, Rio, Sydney...)
- Natural wonders (Grand Canyon, Great Barrier Reef, Sahara, Amazon...)
- Cultural landmarks (Machu Picchu, Angkor Wat, Stonehenge, Petra...)
- Lesser-known gems (Cappadocia, Salar de Uyuni, Plitvice Lakes...)

## Visual Design

### World Map (Canvas-drawn)
- Simplified but recognizable world map with continent outlines
- Mercator-ish projection for familiarity
- Ocean: deep navy blue with subtle grid lines (lat/long)
- Land: muted sage green with country borders as thin lines
- Hover state: crosshair cursor, coordinate display
- Zoom: scroll wheel / pinch to zoom, drag to pan
- Min zoom: full world view. Max zoom: ~4x

### Postcard Panel (right side on desktop, top on mobile)
- Styled like a vintage postcard / travel journal
- Cream/parchment background with torn-edge effect
- Handwriting-style font for clues
- Each clue tier has a "reveal" button styled as a wax seal
- Round number shown as a stamp in the corner

### Pin & Result Display
- Player's guess: red pin with drop shadow
- Actual location: gold star marker
- Connection: dashed arc line between the two
- Distance label on the line
- Score popup with animation

### HUD
- Top bar: current round (1-5), total score, clue multiplier indicator
- Timer: optional (no time pressure by default, but shows elapsed time)

### Color Palette
- Ocean: #1a2744 (deep navy)
- Land: #6b8f71 (sage green)
- Borders: #4a6b4f (dark green)
- Postcard bg: #f5eed6 (parchment)
- Postcard text: #3d2b1f (dark brown)
- UI accent: #c0392b (warm red)
- Gold accent: #d4a017 (for stars/scores)
- Score positive: #27ae60 (green)

### Animations
- Postcard slides in from right at round start
- Clue tiers fade in with a typewriter effect
- Pin drops with a bounce animation
- Arc line draws itself from guess to answer
- Score counter rolls up
- End-of-game: all 5 pins shown on map with scores

## Controls

### Desktop
- Mouse click on map: drop pin (guess)
- Scroll wheel: zoom map
- Click + drag: pan map
- Click clue buttons: reveal next tier
- Spacebar: confirm guess / next round

### Mobile
- Tap on map: drop pin
- Pinch: zoom
- Drag: pan map
- Tap clue buttons: reveal next tier
- Tap confirm button: confirm guess / next round

### Flow
- Tap/click to place pin (can reposition before confirming)
- "Confirm Guess" button locks in the answer
- After result shown, "Next Round" button advances
- After round 5, final score screen with recap

## UI Layout

### Desktop (landscape)
- Left 60%: World map (full height)
- Right 40%: Postcard panel + score display
- Top overlay: round counter, total score

### Mobile (portrait)
- Top 35%: Postcard panel (collapsible)
- Bottom 65%: World map
- Bottom overlay: confirm button, score

## End Screen
- "Journey Complete" header
- World map showing all 5 guess pins + actual locations
- Per-round breakdown: location name, distance, score, multiplier
- Total score with rank:
  - 60,000+ : "World Explorer"
  - 40,000+ : "Seasoned Traveler"
  - 20,000+ : "Tourist"
  - 10,000+ : "Armchair Traveler"
  - < 10,000 : "Lost in Translation"
- "Play Again" button (new random 5 locations)

## Technical Notes
- World map drawn on canvas using simplified coordinate data for continents/countries
- Lat/long to pixel conversion using equirectangular projection (simple, good enough)
- Great-circle distance calculation (Haversine formula) for scoring
- All 50+ locations with clues stored as JS data
- No external APIs or images needed - fully self-contained
- Responsive layout with CSS media queries for mobile/desktop
