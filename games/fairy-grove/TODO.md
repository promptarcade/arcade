# Fairy Grove — What Needs Fixing

Written by the session that built it, with full context of user feedback.

## Current State
- Game runs, sprites load with transparency, camera follows player
- But it's boring, static, and the art isn't used well

## Problems (from user feedback, in priority order)

### 1. Everything is static
Nothing moves except the player. The world feels dead.

**Fix:**
- Bird (fairy-3): should fly in slow circles around the tree canopy area, gentle sine-wave path
- Butterfly (fairy-12): flutter randomly, change direction every few seconds, bobbing flight
- Frog (fairy-16): sit still, then hop every 3-5 seconds toward a random nearby point
- Snail (fairy-13): creep very slowly in one direction
- Ladybug (fairy-8): crawl along a path, maybe on a bush
- Trees: gentle sway — don't move the whole sprite, but apply a slight oscillating skew transform to the top
- Bushes: subtle scale pulse, like breathing
- NPCs (stump, bush): blink animation — periodically close their eyes (draw dark circles over eye positions for 0.2s)

### 2. Ground is boring
It's solid coloured rectangles. Should feel like a real forest floor.

**Fix:**
- Use a proper grass tile pattern — draw varied green patches, not uniform blocks
- Add scattered small details: tiny flowers, grass tufts, fallen leaves, small stones (draw these procedurally, don't need sprites)
- Create distinct zones: grassy meadow, mushroom grove (darker earth), pond area (with reeds), flower garden near the house
- Add a winding path from the mushroom house outward — lighter brown/tan dirt path with soft edges
- The pond needs to look better — add lily pads (green circles), reeds (vertical green lines), animated water ripples

### 3. Assets are disproportionate
The sprites are different sizes in the source images and I didn't normalize them relative to each other.

**Fix — establish a scale reference:**
- The fairy (fairy-0) should be about 48px tall at game scale — she's the unit of measurement
- Mushroom house (fairy-1): about 2.5x fairy height (120px)
- Large tree (fairy-2, fairy-4): about 3x fairy height (150px)
- Bird (fairy-3): about 0.5x fairy height (24px)
- Butterfly (fairy-12): about 0.4x fairy (20px)
- Frog (fairy-16): about 0.6x fairy (30px wide)
- Snail (fairy-13): about 0.5x fairy (25px wide)
- Ladybug (fairy-8): about 0.3x fairy (15px)
- Flowers (fairy-14): about 0.5x fairy (24px tall)
- Mushrooms (fairy-9, fairy-15): about 0.3-0.4x fairy (15-20px)
- Bushes (fairy-6, fairy-7): about 1x fairy width (50px wide)
- Tree stump (fairy-5): about 0.8x fairy (40px wide)

### 4. Game is simple and boring
Collecting items with no purpose is not engaging.

**Fix — add actual mechanics:**
- **Garden growing**: collected flowers/mushrooms can be planted around the mushroom house. Tap/click a spot near the house to place a collected item. The garden grows as you collect.
- **Creature friendship**: each creature has a favourite item. Bring a flower to the bird, a mushroom to the frog, etc. Befriending a creature causes it to follow you back to the grove.
- **Exploration gates**: some areas are blocked by brambles. Collect enough flowers to clear them (flowers have magic). This gives collecting a PURPOSE.
- **Day/night cycle**: gradual colour shift over time. Some creatures only appear at certain times. Fireflies (drawn as glowing dots) appear at night.
- **Sound**: even simple Web Audio tones — a gentle melody, collection chime, creature sounds.

## Sprite Extraction
The extraction tool is at the bottom of the previous session's conversation. The key function:
- Detects the grey/white checkerboard pattern (r > 180, g > 180, b > 180, max-min < 15)
- Flood-fills to find connected non-transparent regions
- Exports each as a PNG with alpha transparency
- Works on any Grok-generated image with "transparent background"

Extracted PNGs are in `games/fairy-grove/sprites/fairy-*.png`

## Other Grok Assets Available
There are 25 images in `engine/sprites/Grok/` including:
- More nature props (trees, mushrooms, rocks, ferns)
- Flowers sheet (daisies, blue flowers, mushroom varieties)
- Fire effects
- Tavern/dungeon furniture (for a different game)
- Character sprites (heroes, dragons, slimes)
- The extraction tool can pull clean sprites from any of them

## Technical Notes
- Game uses fixed 960x540 canvas, CSS-scaled to viewport
- Sprites are separate PNG files loaded individually (not a sprite sheet)
- Camera smoothly follows player with lerp
- Y-sort depth ordering for proper overlap
- Touch controls work via virtual joystick (drag from touch point)
