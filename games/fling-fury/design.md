# Fling Fury — Design Document

## Concept
Slingshot physics game set in a kitchen. You're a fed-up chef launching food at towers of dirty dishes, pots, and pans that rats have built nests in. The rats have taken over the kitchen and fortified themselves behind stacks of crockery. Fling ingredients to smash their dish-forts and chase them out.

## Why This Works
- Kitchen theme is visually distinct from any existing slingshot game
- Food projectiles are colourful, varied, and fun to draw
- Dish/pot/pan structures look completely different from wood/stone/glass
- Rats are a different silhouette and personality from any existing enemy type
- The premise is funny — a chef weaponising his own ingredients

## Core Mechanics
- **Slingshot**: A kitchen ladle mounted on the counter edge. Pull back and aim with drag. Release to launch.
- **Projectile foods**: Each has a unique shape, weight, and ability.
- **Structures**: Built from plates, bowls, pots, cutting boards, and tin cans. Different weights and durability.
- **Enemy rats**: Grey/brown rats hiding in the dish structures. Hit them directly or collapse structures onto them.
- **Levels**: 15 levels across 3 kitchen zones. 3-star scoring.
- **Physics**: Gravity, collision, momentum. Stacks topple realistically.

## Controls
- **Desktop**: Click-drag on ladle to aim. Release to fire. Click mid-flight for ability.
- **Mobile**: Touch-drag to aim. Release to fire. Tap mid-flight for ability.
- **Reset**: R key or retry button.

## Progression
- Zone 1: Countertop (levels 1-5) — simple stacks, learn mechanics
- Zone 2: Stovetop (levels 6-10) — pots and pans, heavier structures
- Zone 3: Pantry Shelves (levels 11-15) — tall precarious towers, tin cans

## Sprite List

### Projectile Foods (32x32 each)
1. **Tomato** — Red, round, juicy. Default projectile. No ability. Splatters on impact (red particle burst). Bright red with green stem on top, highlight shine.
2. **Egg** — Oval, white/cream. Ability: tap to split into 3 smaller fragments that spread. Smooth oval shape, subtle shadow.
3. **Onion** — Purple/brown layered sphere. Ability: tap to release a shockwave (tears!) that pushes nearby objects. Papery skin texture, root wisps at bottom.
4. **Chilli Pepper** — Red/orange, curved elongated shape. Ability: tap to ignite and burn through a structure. Curved body, green stem, angry expression.

### Enemy Rats (24x28 each)
5. **Rat** — Grey-brown, chunky body, big round ears, pink nose, long tail, beady eyes. Sitting upright, holding a crumb. Smug expression. When hit: tumbles off screen with spiral eyes.

### Structure Materials (16x16 tiles each)
6. **Plate** — White/cream ceramic circle seen from the side (thin oval). Stacks vertically. Fragile.
7. **Bowl** — Deeper than plate, blue-patterned ceramic. Medium durability.
8. **Pot** — Dark metal cylinder with handles. Heavy, tough. Copper/iron coloured.
9. **Cutting Board** — Wooden rectangle, warm brown with grain. Medium weight, long and flat.
10. **Tin Can** — Silver cylinder with label. Light, rolls when hit. Ribbed texture.

### Environment
11. **Ladle Slingshot** — 32x48. A large wooden-handled ladle mounted in a stand, with rubber bands attached to the bowl. Sits on the left.
12. **Counter Surface** — 32x16 tiling. Marble/granite countertop. Grey-white with subtle speckle pattern. Clean edge at front.
13. **Kitchen Wall** — Background tile. Subway tile pattern, cream/white with grey grout lines.

### UI Elements
14. **Star** — 16x16. Gold chef's star (like a merit badge). Bright with specular.
15. **Star (empty)** — 16x16. Grey outline version.

## Visual Style
- Warm kitchen palette — creams, warm browns, copper, ceramic whites and blues
- Bright food colours pop against the neutral kitchen background
- Chunky, recognisable shapes — a plate looks like a plate, a rat looks like a rat
- Expressive faces on the food projectiles and rats
- Every sprite must be identifiable at game scale (32px or 16px)

## Audio
- Ladle stretch (rubber band tension rising)
- Launch whoosh
- Ceramic smash (plates/bowls breaking)
- Metal clang (pots/cans)
- Wood thunk (cutting boards)
- Rat squeak when hit
- Tomato splat, egg crack, onion crunch, chilli sizzle
- Star chime on level complete
