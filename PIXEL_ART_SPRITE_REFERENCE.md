# Pixel Art Sprite Creation Reference

Practical techniques for programmatic sprite generation, compiled from Pedro Medeiros (Saint11), Slynyrd, Brandon James Greer, AdamCYounis, Lospec, Pixel Parmesan, and community sources.

---

## 1. Character Size Spectrum

### 8x8 (64 pixels total)
- **Head**: 3-4px wide, 3px tall (nearly half the sprite)
- **Body**: 3-4px wide, 2-3px tall
- **Legs**: 1px wide each, 2px tall
- **Eyes**: Single pixel dots or omitted entirely
- **Arms**: Cannot represent separately; implied by body color
- **Head ratio**: 1-1.5 heads tall
- **Colors**: 2-4 maximum
- **What works**: Direction facing, basic silhouette shape
- **What doesn't**: Facial features, clothing detail, hands, feet

### 16x16 (256 pixels total)
- **Head**: 5-7px wide, 4-5px tall
- **Body/torso**: 5-7px wide, 3-4px tall
- **Arms**: 1px wide (2px blends with torso)
- **Legs**: 1-2px wide, 3-4px tall
- **Eyes**: 1x1 or 2x1 pixels (2x2 if manga style)
- **Head ratio**: 2-3 heads tall
- **Colors**: 3-5 per character, 2-3 per body part (base + shadow + highlight)
- **What works**: Hairstyle, body type, basic clothing color, weapon silhouette
- **What doesn't**: Facial expressions, armor detail, individual fingers
- **Key rule**: Silhouette must tell the whole story at this size

### 24x24 (576 pixels total)
- **Head**: 7-9px wide, 6-7px tall
- **Eyes**: 2x1 or 2x2 with highlight possible
- **Head ratio**: 2.5-3.5 heads tall
- **What adds**: Clothing patterns, accessories, basic expressions

### 32x32 (1,024 pixels total) — THE SWEET SPOT
- **Head**: 8-11px wide, 7-9px tall
- **Eyes**: 2x2 with highlight dot + pupil; enough for emotion
- **Body**: 8-11px wide, 6-8px tall
- **Arms**: 2-3px wide
- **Legs**: 2-3px wide, 5-7px tall
- **Head ratio**: 3-4 heads tall
- **Colors**: 8-16 per character
- **What works**: Facial expressions, distinct armor, visible weapons, equipment, pose variety
- **This is where "classic" pixel art lives** — enough detail for character, small enough to force good design

### 48x48 (2,304 pixels total)
- **Eyes**: 3x3+ allowing pupil, iris, and eyelid
- **Head ratio**: 4-6 heads tall
- **What adds**: Realistic proportions, fine details, emotional expressions, fabric folds begin

### 64x64 (4,096 pixels total)
- **Head ratio**: 4-6 heads (realistic)
- **Colors**: 12-24 per character
- **What works**: Fabric folds, individual fingers, subtle expressions, detailed armor textures
- **Production time**: ~4x longer than 32x32

### Proportion Models
| Model | Use Case | Feel |
|-------|----------|------|
| 2-head (chibi) | Cute/casual games | Round, adorable |
| 3-head | Standard pixel RPG | Classic retro |
| 6-head | Detailed sprites | Slightly cute realistic |
| 8-head | Realistic/tall | Elongated, heroic |

### Body Construction Rules
- **Neck width**: 1/2 to 2/3 of head width
- **Process**: Wireframe -> rough shapes -> final form
- At small sizes, bigger head ratio works better (2-3 heads tall)
- Arms at 16x16 MUST be 1px wide; 2px merges with torso

---

## 2. Monster/Enemy Design

### Silhouette Principles
- Enemy must be identifiable by silhouette alone from gameplay distance
- Exaggerate the ONE defining feature (horns, tentacles, wings, jaws)
- The smaller the sprite, the more you must exaggerate
- Test: fill sprite solid black — if you can't identify it, redesign

### Threatening vs Cute Spectrum

**CUTE indicators:**
- Large eyes relative to body (>25% of head)
- Big pupil, small white area (manga/chibi style)
- Round body shapes, no sharp angles
- Bright, saturated colors
- Short limbs, big head
- Upward-facing features (smile, perked ears)

**THREATENING indicators:**
- Small eyes relative to body, or no visible pupils
- Large white area, tiny pupil (angry stare)
- Angular shapes, sharp protrusions (spikes, horns, claws)
- Darker, desaturated colors with accent glows
- Elongated limbs, small head relative to body
- Downward-facing features (frown, hunched posture)
- 2px horizontal eyes = old age or disinterest/menace

### Common Monster Archetypes

**Slime (simplest enemy)**
- Shape: Dome/blob with wider base ("stretches out a bit")
- Construction: 5 steps — silhouette, light source, shadow mapping, transition softening, optional face
- Key technique: Bright outline creates translucency illusion
- Shading: Light from top-right, cold tones on bottom
- Animation: Squash-and-stretch on every movement
- Variants: Change color + shape modifier (cube=ice, angular=crystal, dripping=poison, glowing=fire)
- At 16x16: 4 colors sufficient (base, shadow, highlight, eye)
- Internal objects shown via dark shadows with reduced highlights

**Skeleton**
- Key features: Skull shape, visible rib suggestion, thin limbs
- At 16x16: Skull is 4-5px wide, body narrower than human sprite
- Distinguish from human by: thinner limbs (1px), visible gaps between ribs, no flesh color
- Weapon (sword/bow) is critical identifier at small sizes
- White/bone color with 2-3 shading tones

**Bat**
- Shape: Wide wingspan relative to tiny body
- At 16x16: Body 3-4px, wings span 10-14px
- Wing animation: 2-4 frames, up/down sweep
- "Simple but dangerous flying enemy" — readability from wing silhouette alone

**Golem**
- Shape: Massive, blocky, wider than tall
- Key features: No visible neck, thick limbs, rough texture
- Color: Grey/brown stone with crack details
- Slow animation timing conveys weight

**Dragon**
- Shape: Distinguished by wings + elongated snout + tail
- At small sizes: Focus on head profile (snout) + wing spread
- Color: Bold single hue with lighter belly
- Fire breath = instant identification even at 16x16

### Monster Design Process
1. Start with silhouette (solid color blob)
2. Establish ONE identifying feature exaggerated
3. Apply base color + shadow + highlight (3-tone minimum)
4. Add eyes/face last (determines personality)
5. Test at gameplay zoom level — if unclear, simplify further

---

## 3. Animals

### Key Identification Features (minimum pixels to be recognizable)

**Dog**
- Floppy ears (or pointed for specific breeds) — THE identifier
- Wagging tail (animation sells it)
- Snout protrusion from head
- At 16x16: Body 8-10px long, 5-6px tall, ears 2-3px

**Cat**
- Pointed triangular ears — THE identifier
- Curved upward tail
- Smaller snout than dog (flatter face)
- At 16x16: Ears must be distinct triangles, tail curves up

**Bird**
- Beak (sharp triangle protrusion) — THE identifier
- Wing shape (even folded)
- Tail feathers
- At 16x16: Body can be 4-6px, beak 1-2px triangle, wings implied by color

**Fish**
- Tail fin (forked shape) — THE identifier
- Streamlined body (horizontal oval)
- Eye dot
- At 16x16: 8-10px long, 3-4px tall, tail fin 2-3px

**Horse**
- Long legs relative to body — THE identifier
- Elongated snout/head
- Mane on neck
- At 16x16: Legs must be visibly longer than body is tall

**Chicken**
- Red comb on head — THE identifier
- Round body, small head
- Beak (tiny triangle)
- Tail feathers pointing up/back

### Quadruped Walk Cycle

**4-Frame Walk (minimum viable):**
1. Right legs forward, left legs back (contact)
2. Legs passing through center (passing)
3. Left legs forward, right legs back (contact)
4. Legs passing through center (passing)

**Critical rules:**
- Back leg follows ONE STEP BEHIND front leg on OPPOSITE side (diagonal pairs)
- Distance traveled must be IDENTICAL for front and back legs (prevents accordion stretching)
- Spine undulates: back pelvis and front shoulders move in OPPOSITE but EQUAL vertical motion
- Running: Legs work in PARALLEL pairs (not alternating) — both fronts then both backs

**NES optimization trick:** Don't shade legs differently — front and back legs can share the same frames, halving sprite work.

**Bird Flight (8 frames ideal):**
- Define wing joints as wireframe first (prevents rubbery look)
- Extremes of motion are keyframes
- Animate wings first, then add body bob
- Thicken wings and add tail last

### General Animal Animation
- Animate ONE section at a time across ALL frames (legs first, then body, then head)
- Start with flat-colored body parts, test motion before adding detail
- Fewer frames acceptable for game sprites vs realistic study

---

## 4. Insects

### General Approach at Pixel Scale
- Insects are defined by SEGMENTED BODIES (head, thorax, abdomen)
- Leg count simplification: Real insects have 6 legs; at 16x16, show 2-4 legs (or even 2)
- Spiders get 8 legs in theory, show 4-6 at small sizes

### Butterfly
- **Body**: Thin vertical line, 1px wide, 4-6px tall
- **Wings**: THE identifier — symmetrical, occupy most of sprite area
- Construction: Body first, then wing outlines, fill main color, lighter inner section
- Hind wings distinctly rounder and SMALLER than front wings
- At 16x16: Wings span 12-14px wide, body 1px wide
- Wing patterns: Use 2-3 colors per wing, symmetrical about body axis
- Animation: 2-4 frames, wings up/flat/down

### Bee
- **Body**: Three segments clearly visible (head, thorax, abdomen)
- Yellow-black stripes on abdomen — THE identifier
- Teardrop-shaped wings (smaller than butterfly wings relative to body)
- At 16x16: Body 6-8px long, stripes 1px each alternating

### Spider
- **Body**: Two segments (cephalothorax + abdomen), both round
- Legs radiating outward — THE identifier
- At 16x16: Body 4-6px, legs 3-4px extending outward
- Fangs: 1-2px below head if visible
- Web: Single pixel lines radiating from center

### Beetle
- **Body**: Oval/round shell shape
- Hard shell (elytra) with center line — THE identifier
- Short legs beneath, often partially hidden
- At 16x16: Shell 6-8px wide, center split line 1px

### Available sizes for insects: 16x16, 24x24, and 32x32 are standard

---

## 5. Flowers and Plants

### General Principle
"Embrace abstraction. Don't try to force realistic details simply for the sake of accuracy." Pixel plants develop "a whole new charming aesthetic" compared to real life.

### Flower Construction at Pixel Scale

**Rose**
- Spiral petal pattern from center outward
- At 16x16: 5-7px flower head, 3-4 concentric color rings
- Colors: 3 tones of red/pink (dark center, medium mid, light outer)
- Thick lines along petal edges for depth
- Add 1-2px leaves below

**Daisy**
- Radial petals around center dot
- At 16x16: Yellow center 2-3px, white petals radiating 2-3px out
- Simplest flower to pixel — circle of light pixels around dark center
- 5-8 petals visible (implied, not all drawn)

**Tulip**
- Cup shape (3 petals visible from side)
- At 16x16: 4-5px wide cup, 3-4px tall, on 1px stem
- Three petals + three sepals (look identical in pixel art)
- Use 2 tones of color for depth

**Sunflower**
- Large dark center + radiating yellow petals
- At 16x16: Center 3-4px dark brown, petals 2-3px radiating yellow
- Most recognizable flower at small sizes due to high contrast center

### Leaf Shapes
- At pixel scale, "you'll rarely have the resolution to explicitly depict leaves of a specific species"
- General categories: linear (thin), lanceolate (pointed oval), cordate (heart), palmate (hand-like)
- At 16x16: Most leaves are 2-4px long, 1-2px wide
- Use 2 greens (light top, dark bottom) for minimal leaves

### Mushroom Construction
- **Cap**: Dome shape, top half of sprite
- **Stem**: Cylinder, bottom half, narrower than cap
- At 32x32: Cap 10-14px wide, stem 4-6px wide
- Colors: Red/brown cap, white/tan stem, white spots on cap
- Shading: Shadow on bottom of cap, shadow on stem from cap overhang
- Highlight: Top-center of cap

### Grass Technique
- Mix flat green spaces with textured areas of varying vegetation density
- Variation feels natural; negative space helps reduce noise
- Don't texture every pixel — let the environment breathe
- Occasional flower variants (single colored pixels) add life
- Blade tips: 1px points rising above base line, varying heights

### Vine Patterns
- 1px wide curving line with periodic leaf attachments
- Leaves alternate sides along the vine
- Color: 2 greens (stem darker, leaves lighter)
- Curves should follow organic arcs, never straight lines

---

## 6. Trees — Comprehensive

### Universal Tree Construction Process
1. **Stick guide**: Draw trunk + main branch skeleton
2. **Rough canopy**: Block in overall foliage shape
3. **Shading pass**: Apply light direction (standard: top-left)
4. **Leaf texture**: Add cluster detail without overdoing it
5. **Trunk detail**: Add bark texture, knots, roots

### Trunk Construction
- Base shape: Vertical cylinder
- Bark texture: Horizontal striping, WIDEST at center, narrowing toward edges
- Break up lines irregularly for organic feel
- Add knots or errant roots for character
- Colors: 3-4 tones (dark shadow side, medium base, light side, highlight)

### Canopy/Foliage: The Modular Method
1. Create ONE leaf bundle module (small geometric unit, ~2x2px base)
2. Make 3 color variants: dark, medium, light (by hue-shifting the ramp)
3. Layer bundles: dark at bottom/back, light at top/front (follow light source)
4. Bundles can TOUCH but avoid OVERLAPPING to maintain unit clarity
5. "Not every leaf needs to be represented — just enough to give the impression"
6. "Too much variation creates displeasing noise" — keep clusters consistent

### Tree Types

**Oak (Round Canopy)**
- Canopy shape: Large sphere/dome, wider than tall
- Trunk: Thick, short, possibly splitting into major branches
- Foliage: Dense, rounded clusters
- At 32x32: Trunk 4-6px wide, canopy 20-26px wide, 14-18px tall

**Pine/Fir (Triangular)**
- Canopy shape: Triangle/cone, taller than wide
- Construction: Draw triangle guide, horizontal lines for branch levels, outline with zigzag
- Work TOP to BOTTOM (upper branches overlap lower)
- Branch layers: Each row slightly wider than the one above
- Define light/medium/dark branches with shadow between overlapping rows
- At 32x32: 10-14px wide at base, 20-24px tall
- Green with blue-shift for shadows

**Palm (Fronds)**
- Trunk: Tall, thin, slight curve, may have horizontal ring marks
- Canopy: 4-8 fronds radiating from top center, drooping downward
- Each frond: Thin center line with short perpendicular leaf pixels
- At 32x32: Trunk 2-3px wide, 16-20px tall, fronds 8-12px long

**Birch (Narrow)**
- Trunk: Distinctive white bark with horizontal dark marks
- Canopy: Narrow oval, taller than wide
- Trunk detail: White base with short dark horizontal dashes
- Foliage: Lighter, more sparse than oak

**Cherry Blossom (Pink)**
- Canopy: Similar to oak shape but with PINK foliage
- "Leaves are small, so knowing they're pink with little bright spots is most important"
- Trunk: Brown/pale, more twisted/organic than straight
- Falling petals (scattered pink pixels below canopy) sell the effect
- Cracks and crevices in bark "imply bark texture"

### Seasonal Variants

**Spring**: Light green foliage, flower buds (scattered pink/white pixels), fresh growth
**Summer**: Full dark green foliage, dense canopy, maximum leaf coverage
**Autumn**: Orange/red/yellow palette swap on foliage, some leaves falling (scattered pixels below)
**Winter (Deciduous)**: Remove ALL foliage, show bare branch skeleton; optionally add snow (white pixels on top edges of branches)
**Winter (Conifer)**: Keep green foliage but add white pixels on top edges of each branch layer

### Shadow Placement
- Drop shadow directly below (practical for game use)
- OR offset to one side matching light direction (more dynamic)
- Shadow color: Darker, desaturated version of ground color

---

## 7. Sub-Pixel Animation

### Core Concept
"Animating your anti-aliasing" — moving COLORS instead of PIXELS to create the illusion of movement finer than one pixel.

### Why It Exists
At 16px tall, moving one whole pixel is a huge positional shift. Sub-pixel animation allows subtle movements (breathing, swaying, ponytail bounce) without jarring pixel jumps.

### Technique: Color Shifting
- Instead of moving a pixel left/right, change its COLOR to blend with its neighbor
- If a feature is "50% between" two pixel positions, use a color at 50% between the two neighboring colors
- Frame-by-frame, shift these intermediate colors to simulate gradual movement

### Technique: Smearing
- An element leaves parts of itself behind, stretching across pixels
- Stagger pixel movement over multiple frames
- Creates illusion of slower, smoother motion than whole-pixel jumps

### Technique: Outline Tweening
- Smoothly transition an object's edge through pixels
- Like viewing through a screen door — edges fade in/out at boundaries

### Practical Rules
- Use as FEW shades as possible: 1-2 shades of AA maximum
- Sub-pixeling is about MOVEMENT, not shading — don't confuse with "animated shading"
- Works at both low res (Metal Slug's 34px characters) and high res (500px+ characters)

### Real-World Examples
- **Metal Slug (Fio)**: 34 pixels tall. Ponytail uses 4 pixels toggled on/off. Breathing achieved via color shifting, not pixel displacement. Head remains stable through color shift alone.
- **Celeste**: Sub-pixel movement on idle animations

### Implementation for Code
```
// Conceptual sub-pixel shift
// Object at position 5.5 between pixel 5 and 6:
pixel[5].color = lerp(bgColor, objectColor, 0.5)
pixel[6].color = lerp(bgColor, objectColor, 0.5)

// Object at position 5.75:
pixel[5].color = lerp(bgColor, objectColor, 0.25)
pixel[6].color = lerp(bgColor, objectColor, 0.75)
```

---

## 8. Readability Rules

### The Silhouette Test
- Fill your sprite solid black against white background
- If you cannot identify what it is, the design fails
- At gameplay zoom, players see silhouette FIRST, color SECOND, detail LAST
- "The smaller your sprite, the more you need to exaggerate poses"

### Feature Hierarchy (what players read first)
1. **Silhouette/shape** — overall form and size
2. **Color** — hue and value contrast
3. **Internal detail** — facial features, patterns, textures
4. **Animation** — movement confirms what the static frame suggests

### Color Contrast Minimums
- Characters must pop against EVERY possible background
- Outlines help separate sprites from backgrounds and each other
- Foreground sprites should be MORE saturated than backgrounds
- Different colors within sprite must be distinguishable at gameplay zoom

### Anti-Aliasing vs Readability Trade-off
- "The more anti-aliased an image, the less readable it is"
- On outer edges of game sprites: AVOID AA (varies with background)
- On small sprites: AA often reads as noise
- Internal AA: acceptable for form definition
- Always ask: "Is this AA really necessary?"

### Outline Strategies for Game Readability
| Strategy | When to Use |
|----------|-------------|
| Full black outline | Maximum readability, retro style |
| Colored outline (selout) | Softer look, enough contrast |
| No outline | Large sprites, strong internal contrast |
| External only | Save internal space for detail |

### Pose Exaggeration
- Wider stances read better than narrow
- Weapons/tools should extend BEYOND body silhouette
- Arms away from body at small sizes
- Head tilt, lean, or gesture must be visible in silhouette

---

## 9. Style Consistency

### The 6-Element Style Bible
Document these SIX things before starting any game's art:

1. **Resolution**: Base sprite size + grid alignment (e.g., 32x32 characters, 16x16 tiles — NOT 24x24 mixed in)
2. **Palette**: Locked color set, imported into editor
3. **Outline rules**: Black / colored / none — PICK ONE, mixing looks terrible
4. **Shading style**: Flat / cel-shaded (2-3 tones) / gradient+dithering
5. **Animation timing**: Base frame duration + frame counts per action
6. **Proportions**: Head ratio + boss scaling rules

"Twelve lines. Prevents ninety percent of the visual inconsistency that tanks indie projects."

### Outline Weight Consistency
- Pick 1px or 2px outlines and maintain across ALL sprites
- Line weight can vary: thicker on shadow side, thinner on light side
- Inside lineart should be thinner/lighter than outside outline
- Selective outlining: Take bordering pixel color, go one shade darker

### Saturation Control
- Keep MOST of palette slightly desaturated
- Reserve full saturation for: highlights, magic effects, pickups, UI callouts
- Backgrounds LESS saturated than foreground sprites
- Shadows: hue-shifted cool (toward blue/purple)

### Light Direction
- Pick ONE direction (top-left is standard) and maintain across ALL sprites
- Every character, monster, tree, item — same light angle
- Inconsistent lighting is the #1 style-breaking error

### Proportion Consistency
- All characters at same head ratio (don't mix 2-head chibi with 4-head realistic)
- Body part sizes should be uniform (heads, eyes, torsos all similar scale)
- Bosses can break scale rules intentionally (2x or 3x normal sprite size)

### Animation Timing Standards
- Base: ~80ms per frame (adjustable per project)
- Walk: 4-6 frames
- Jump: 4 frames
- Attack: 5 frames
- Variable duration: slow anticipation, fast action, slow recovery
- "A 4-frame walk with good timing beats 8 frames with flat timing"
- 1px compression before jump, 1px stretch at peak (squash-and-stretch)

---

## 10. Palette Techniques

### Hue Shifting Fundamentals

**The problem with "straight ramps":**
- Beginners only change brightness and saturation
- Results look dull, muddy, and impossible to harmonize across different hue ramps

**The solution — hue shift within every ramp:**
- Each swatch shifts ~20 degrees POSITIVE on the color wheel from the previous
- Shadows shift AWAY from light source hue (typically toward blue/purple)
- Highlights shift TOWARD light source hue (typically toward yellow/orange)
- This creates vibrancy and cross-ramp harmony

### Warm Highlights, Cool Shadows
- Highlights: Shift hue toward yellow, increase brightness, slightly decrease saturation
- Midtones: Peak saturation zone, base hue
- Shadows: Shift hue toward blue/purple, decrease brightness, slightly decrease saturation
- "Shadows on red -> darker red-purple. Highlights on red -> orange-yellow."

### Saturation Curve (Not Linear!)
- Darkest: Low-medium saturation
- Midtones: PEAK saturation (this is where color is most vibrant)
- Lightest: Low saturation (washed out toward white)
- Never fully maximize or minimize saturation
- Saturation takes LARGER steps at extremes, SMALLER steps near peak
- Dark colors tolerate higher saturation than light colors
- Never combine high saturation with high brightness (visually uncomfortable)

### Professional Palette Specifications
- **Mondo palette**: 128 colors total, 9 swatches per ramp, 8 ramps at 45-degree intervals = full 360-degree coverage
- **Per-ramp hue shift**: +20 degrees between consecutive swatches
- **Brightness**: Steadily increases left to right, smaller increments approaching 100%

### Colors Per Sprite (Professional Standards)

| Context | Color Count |
|---------|-------------|
| Game Boy retro | 4 colors total |
| 8-bit / NES style | 3-4 per sprite (hardware limit) |
| Tight indie | 8-16 per sprite |
| SNES era | 15 colors + transparency |
| Standard indie (sweet spot) | 16-32 total game palette |
| Celeste character | 12 colors (including transparency) |
| Street Fighter 2 character | 15 colors + transparency |
| Hi-bit modern | 32-64 total game palette |
| Per-sprite rule of thumb | "If >32 colors per sprite, you need a very good reason" |

### Palette Distribution in Scene
- Main color: largest area percentage
- Secondary color: remainder
- Accent colors: 10-20% — "contain a lot of weight, use sparingly"

### Specular Highlights
- Yellow recommended for highlights/whites: high luminosity, flexible saturation at high values, conveys warmth

### Color Gamut Construction
1. Select 2-3 primary colors as palette extremes
2. Connect them geometrically on color wheel (triangle or line)
3. All colors within that geometric shape will appear cohesive
4. Center of shape = "subjective neutral" of the palette

### Dithering (When to Use)
- YES: Backgrounds, large flat areas, low-color-count pieces, sky gradients
- NO: Character sprites (especially animated ones — coherent dithering across frames is extremely difficult)
- NO: Small sprites with lots of detail
- Checkerboard dithering simulates a middle color between two existing colors
- "Dithering between heavily contrasted colors gives a dirty and noisy image"

---

## Quick Reference: Programmatic Sprite Generation Checklist

For generating sprites in code:

1. **Start with silhouette** — define the bounding shape first
2. **Establish base color** — 1 flat fill
3. **Add shadow** — same hue shifted 20deg toward blue, lower brightness, lower saturation
4. **Add highlight** — same hue shifted 20deg toward yellow, higher brightness, lower saturation
5. **Add outline** — 1 shade darker than darkest adjacent fill color
6. **Add eyes/features** — highest contrast pixels in the sprite
7. **Test at game scale** — zoom out, squint test, silhouette test
8. **Animate** — squash-and-stretch, variable timing, sub-pixel for subtle motion

### Key Numbers for Code
- Shadow color: hue +20deg toward blue, brightness -20%, saturation -10%
- Highlight color: hue +20deg toward yellow, brightness +20%, saturation -10%
- Outline color: brightness -30% from darkest adjacent color, same hue
- Selout outline: sample adjacent fill, go 1 shade darker
- AA intermediate: lerp between two colors at ~50% (max 1-2 AA shades)
- Animation: 80ms base frame timing, vary per action phase
