# Snip & Feed — Design Document

## Concept
A physics puzzle game inspired by rope-cutting mechanics. A piece of candy hangs from ropes attached to anchor points. The player cuts ropes by swiping/clicking through them, causing the candy to swing and fall. The goal: drop the candy into Nom-Nom's mouth (a small hungry creature at the bottom of each level).

Each level introduces new mechanics: multiple ropes, bubbles that float candy upward, bellows that blow candy sideways, teleport portals, and moving obstacles. Stars scattered around each level reward skillful rope-cutting order and timing.

## Core Mechanics
- **Rope Physics**: Ropes are elastic constraints connecting candy to anchor points. Cutting a rope releases that constraint, and gravity + momentum do the rest.
- **Cutting**: Player swipes/clicks across a rope to cut it. A glowing slash effect plays on cut.
- **Stars**: 3 collectible stars per level. Candy must pass through them before reaching Nom-Nom. Stars affect score.
- **Gravity**: Candy falls naturally. Momentum from swinging carries through cuts.
- **Level Progression**: 20 levels across 2 worlds (10 each), unlocking sequentially.

## Worlds
1. **Cardboard Box** (Levels 1-10): Simple brown background, basic rope puzzles. Introduces ropes, stars, and Nom-Nom.
2. **Toy Shelf** (Levels 11-20): Colorful background. Introduces bubbles and bellows.

## Game Elements

### Characters

#### Nom-Nom (the creature)
- **Description**: A round, green blob creature with huge happy eyes, a wide open mouth, and tiny stubby arms. Sits at the bottom of the level waiting for candy. Animates with excitement when candy is near, chomps happily when fed.
- **Canvas size**: 48x48
- **Palette**: Green body (#4CAF50, #388E3C, #2E7D32, #1B5E20), white eyes, black pupils, pink mouth interior (#E91E63)

### Props

#### Candy
- **Description**: A wrapped hard candy — oval center (red/white swirl stripes), twisted wrapper ends on left and right (golden/yellow cellophane). Shiny highlight spot.
- **Canvas size**: 32x24
- **Palette**: Red (#E53935, #C62828), white (#FFF, #E0E0E0), gold wrapper (#FFD54F, #FFC107, #FFA000)

#### Rope Segment
- **Description**: Rendered procedurally as a series of connected line segments with slight brown/tan coloring and a woven texture look. Not a sprite — drawn via canvas path rendering with variable thickness.
- **Colors**: #8D6E63 (main), #6D4C41 (shadow), #A1887F (highlight)

#### Rope Anchor
- **Description**: A small metallic hook/pin embedded in the background. Silver circle with a curved hook shape.
- **Canvas size**: 16x16
- **Palette**: Silver (#BDBDBD, #9E9E9E, #757575, #616161)

#### Star
- **Description**: A classic 5-pointed star, bright yellow with an orange outline, slight sparkle highlight. Pulses gently when idle. Pops with particles when collected.
- **Canvas size**: 24x24
- **Palette**: Yellow (#FFEB3B, #FDD835, #F9A825), orange outline (#FF8F00)

#### Star (Empty)
- **Description**: Same star shape but grey/translucent, shown in the HUD for uncollected stars.
- **Canvas size**: 24x24
- **Palette**: Grey (#9E9E9E, #757575, #616161, #424242)

#### Bubble
- **Description**: A translucent soap bubble, round with a rainbow sheen highlight on the upper-left. When candy touches it, candy floats upward inside the bubble until the player taps to pop it.
- **Canvas size**: 40x40
- **Palette**: Light blue (#B3E5FC, #81D4FA), white highlight, thin border (#4FC3F7)

#### Bellows (Air Puffer)
- **Description**: A small wall-mounted fan/bellows that blows a stream of air in one direction. Wooden frame with a visible gust of air lines. Pushes candy horizontally when in the air stream.
- **Canvas size**: 32x32
- **Palette**: Wood (#8D6E63, #6D4C41, #5D4037), metal nozzle (#9E9E9E), air lines (#B3E5FC alpha)

### Backgrounds

#### Cardboard Box (World 1)
- **Description**: Warm brown corrugated cardboard. Drawn procedurally — tan base with horizontal groove lines and subtle fold creases. Slight vignette at edges.
- **Palette**: #D7CCC8, #BCAAA4, #A1887F, #8D6E63

#### Toy Shelf (World 2)
- **Description**: Colorful wooden shelf background. Light wood grain with colorful toy silhouettes in the far background (blocks, a teddy bear outline, building bricks). Brighter and more playful.
- **Palette**: #FFF8E1, #FFE0B2, #FFCC80, #FFB74D, pastel toy shapes

### UI Elements

#### Cut Effect
- **Description**: A bright glowing slash line that fades quickly. White core with a colored glow (cyan/electric blue). Rendered as a short-lived particle trail along the swipe path.
- **Colors**: White core (#FFF), cyan glow (#00E5FF, alpha fading)

#### Level Complete Banner
- **Description**: A "Level Complete!" banner with earned stars shown. Buttons for "Next Level" and "Retry". Rendered as a centered card overlay.

#### Level Select Grid
- **Description**: Grid of level buttons (numbered 1-20), locked levels shown with a padlock icon. Earned stars shown under each unlocked level.

## Controls

### Desktop (Mouse)
- **Cut rope**: Click and drag across a rope (swipe gesture)
- **Pop bubble**: Click on a bubble
- **Navigate menus**: Click buttons

### Mobile (Touch)
- **Cut rope**: Swipe finger across a rope
- **Pop bubble**: Tap on a bubble
- **Navigate menus**: Tap buttons

## Physics System
- Verlet integration for rope simulation (chain of point masses with distance constraints)
- Gravity: constant downward force
- Rope segments: 8-12 point masses per rope, distance-constrained
- Candy: single point mass attached to rope end(s)
- Collision: candy is a circle, Nom-Nom has a rectangular catch zone
- Star collection: circle-circle overlap detection
- Bubble: overrides gravity with upward force while candy is inside
- Bellows: applies horizontal force in a rectangular zone

## Scoring
- 1 star: candy reaches Nom-Nom
- 2 stars: candy collects 1-2 stars on the way
- 3 stars: candy collects all 3 stars

## Level Design Principles
- Levels 1-3: Single rope, direct drop, stars in the path
- Levels 4-6: Two ropes, need to cut in right order for swing trajectory
- Levels 7-10: Three ropes, offset Nom-Nom position, timing matters
- Levels 11-13: Introduce bubbles
- Levels 14-16: Introduce bellows
- Levels 17-20: Combine all mechanics, complex multi-step solutions

## Technical Notes
- Single HTML file, all code inline
- Canvas-based rendering at 100vw x 100vh
- 60fps game loop via requestAnimationFrame
- All sprites drawn procedurally (inline draw functions)
- Verlet rope physics updated at fixed timestep
- Touch and mouse input unified into a single swipe detection system
- Level data stored as JSON objects defining anchor positions, rope connections, star positions, Nom-Nom position, and special elements
- Positions stored as percentages of canvas size for responsive layout
