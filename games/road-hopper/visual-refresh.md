# Road Hopper — Visual Refresh

## Overview
Upgrade the visuals of Road Hopper (Frogger-style) from flat rectangles to detailed, characterful canvas art. The game already has solid mechanics, audio, and responsive layout — this is purely a visual pass.

## What's Already Good (Keep)
- Frog: ellipse-based body, legs, eyes, spots, hop squish animation — decent, just needs polish
- Turtles: ellipse shells with pattern, head, legs, dive animation — reasonable
- Lily pads: circle with notch and veins — OK
- Death animations: splash rings + splat flattening — functional
- Water ripple lines — exist but subtle
- Lane markings — dashed lines exist

## What Needs Upgrading

### 1. Cars (Currently: colored rectangle + rectangle windshield + rectangle wheels)
Replace with shaped vehicles that have personality:
- **Sedan** (small, fast): rounded body with curved roofline, proper windshield trapezoid, round wheels with hubcaps, taillights. Colors: red, blue, yellow, white
- **SUV** (medium): taller box profile, roof rack hint, bigger wheels. Colors: green, grey, black
- **Sports car** (small, fastest): low-slung wedge profile, single windshield band, wide wheels. Colors: red, orange
- Each car type drawn with: body shape (rounded rect or path), window glass (lighter tint), 2 visible wheels (circles with rims), headlights (front glow), taillights (red dots)
- Exhaust puff particles trailing behind fast cars

### 2. Trucks (Currently: colored rectangle + darker cab)
- **Cargo truck**: distinct cab + trailer separation, exhaust stack on cab, "CARGO" or stripe on trailer, 3 wheel pairs
- Add a mud flap detail, cab windshield, side mirrors as tiny rectangles

### 3. Logs (Currently: brown rectangle with rounded ends)
- Add **bark texture**: darker vertical streaks along the surface, small knot circles
- Add **moss patches**: green-tinted areas on top surface
- Small branch stubs poking out at odd angles
- Waterline shadow: darker tint on lower half where log meets water
- Keep rounded ends but add tree-ring circles on the cut faces

### 4. Water (Currently: flat #1a3a5c with very faint ripple lines)
- **Animated water**: subtle colour cycling between 2-3 blue tones
- **Better ripples**: sine-wave displacement of horizontal bands, white foam caps near logs/turtles
- **Reflections**: faint mirrored colour of objects above (logs = brown tint, turtles = green tint)
- **Depth gradient**: lighter near shore (rows 1, 5), deeper in middle (row 3)

### 5. Road (Currently: flat #2c2c2c with dashed center line)
- **Asphalt texture**: subtle noise/speckle on the road surface
- **Proper lane markings**: white dashed lines between lanes, solid edge lines already exist
- **Tyre marks**: faint dark streaks on road surface (static, decorative)
- **Manhole covers**: occasional circle detail on road (decorative)

### 6. Grass/Safe Zones (Currently: flat green with tiny blade rectangles)
- **Richer grass**: varied-height blade clusters, 3 shades of green
- **Flowers**: small coloured dots scattered (yellow, white, pink) — purely decorative
- **Path hint**: lighter strip where the frog typically crosses (worn grass)
- **Dandelions or clover**: 1-2 per safe zone cell

### 7. Frog Polish
The frog is the best-drawn entity already but could use:
- **Toe detail**: tiny toe pads on the feet (circles at foot tips)
- **Mouth line**: subtle curve under the eyes
- **Shadow**: faint ellipse shadow under the frog on land, ripple on water
- **Blink**: occasional eye-blink animation (eyes close briefly every few seconds)

### 8. Turtles Polish
- **Shell hexagon pattern**: replace single ellipse outline with 2-3 hexagonal shapes on shell
- **Head detail**: add tiny eye dots on the head circle
- **Flipper shapes**: replace leg circles with small paddle shapes
- **Water displacement**: small wake lines behind moving turtles

### 9. Home Row
- **Lily pads**: add a tiny flower bud on some pads (pink circle with yellow center)
- **Bushes between homes**: replace flat green rectangles with layered circular bush shapes, berry dots
- **Fireflies**: small glowing dots that pulse near the home area (decorative particles)

### 10. HUD
- Keep the existing functional HUD but:
  - Add a small frog icon next to lives count
  - Pulse the timer bar when time is low (< 5s)

### 11. Particles & Effects
- **Hop splash**: small water droplets when frog lands on log/turtle
- **Car exhaust**: tiny grey puffs trailing behind vehicles
- **Leaf float**: occasional leaf drifting on water surface (decorative)

## Priority Order
1. Cars & trucks (most screen time, most visually flat)
2. Water (backdrop for half the game)
3. Road surface (backdrop for other half)
4. Logs (high visibility)
5. Grass zones (quick win)
6. Frog polish (already decent)
7. Turtle polish (already decent)
8. Home row details
9. Particles & effects
10. HUD tweaks

## Implementation Approach
All changes are in-place modifications to the existing drawing functions (`drawCar`, `drawTruck`, `drawLog`, `drawBackground`, `drawFrog`, `drawTurtleGroup`, `drawHomes`). No structural changes to game logic, collision, or layout.
