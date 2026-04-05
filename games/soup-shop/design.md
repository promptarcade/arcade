# Soup Shop — Design Document

## Art Style: Chibi (32-48px characters, 16-24px props)

All art rendered at runtime using PixelCanvas drawPost with dual-palette warm/cool shading. Character template from training Level 5 (sphereV head with face bias, cylinderV body). Consistent upper-left light direction across all elements.

Reference games: Overcooked (pace), Papa's games (clarity), Stardew Valley (chibi proportions)

## Concept

A cozy cooking arcade game. Customers arrive with soup orders shown as ingredient icons in speech bubbles. Click/tap ingredients to toss them in the pot, then serve. No hard fail state — customers wait patiently, but speed earns bonus coins. Earn coins to unlock new ingredients and recipes.

The community suggestion: "no goal; just make soup/other food with various ingredients, and feed customers. Or make orders. either way works."

## Core Mechanics

1. **Ingredient shelf** — 6 clickable ingredients along the bottom (tomato, carrot, onion, mushroom, potato, pepper)
2. **Cooking pot** — center of screen. Ingredients animate into it when clicked.
3. **Serve button** — appears when pot has ingredients. Click to serve current customer.
4. **Customer queue** — up to 3 customers visible on the right. Each has a speech bubble showing 1-3 required ingredient icons.
5. **Coins** — earned per serve. +10 per correct ingredient, +5 speed bonus if served within 8 seconds. Unlock new ingredients at thresholds.
6. **No fail state** — customers wait patiently. Wrong orders still earn 1 coin (participation). Correct orders earn full coins + happy reaction.

## Controls

- **Desktop**: Click ingredients to add, click Serve to deliver
- **Mobile**: Tap ingredients, tap Serve. All touch targets minimum 48px.

## Visual Entities

### Characters (chibi, ~24px wide at game scale)

All use the proven drawMiniChar pattern: sphereV head with face bias (`v=0.5+v*0.5` when `ny<0.7, |nx|<0.55, nz>0.6`), cylinderV body, 3×3 eyes with pupil+specular, 5px neck.

| Entity | Description | Key Colours |
|--------|-------------|-------------|
| Chef | White toque+apron, blue shirt, brown hair | cloth #E8E0D0, shirt #5B8EC2, hair #8B6542 |
| Customer 1 | Blonde long hair, red shirt | hair #D4B060, shirt #C85040 |
| Customer 2 | Dark spiky hair, green shirt (kid) | hair #3A3530, shirt #5AAA60 |
| Customer 3 | Grey hair bun, purple cardigan | hair #A8A0A0, shirt #8A5A8A |

Shared: skin lit #F2C4A0, skin shd #9B7B8A, pants #7A7A6E, shoes #5A4030

### Props

| Entity | Description |
|--------|-------------|
| Cooking pot | Copper cylinder, dark interior, side handles. Metal specular (quintic S-curve). |
| Ingredient icons | 16×16 each. Sphere-lit with dual palette. Recognizable from colour alone at small scale. |
| Serve button | Green rounded rectangle, "SERVE" in light text |
| Speech bubble | White rounded rect with ingredient icons inside, tail pointing to customer |
| Coin | Small gold circle with highlight |
| Hearts/stars | 10×10, for UI display |

### Ingredients (6 base, 2 unlockable)

| Ingredient | Shape | Lit Colour | Shadow Colour |
|-----------|-------|-----------|--------------|
| Tomato | Sphere | #DD4433 | #882222 |
| Carrot | Horizontal taper | #DD8833 | #885522 |
| Onion | Sphere with layers | #CC99DD | #775588 |
| Mushroom | Cap on stem | #CCAA88 | #886644 |
| Potato | Lumpy oval | #CCAA77 | #887755 |
| Pepper | Bell shape | #DD4444 | #883322 |
| Broccoli (unlock) | Tree shape | #448833 | #336622 |
| Corn (unlock) | Oval cob | #DDAA33 | #886622 |

### Background

| Element | Description |
|---------|-------------|
| Kitchen wall | Warm brown gradient (#8A7A68), darker at top |
| Floor | Checkered tiles, warm brown (#6A5A48) |
| Counter | Pale wood (#C8B090), runs along bottom behind ingredients |

### Effects (canvas-drawn, no sprites)

| Effect | Description |
|--------|-------------|
| Steam | White semi-transparent circles rising from pot |
| Ingredient toss | Arc animation from shelf to pot |
| Coin pop | +N floats up from served customer |
| Happy face | Customer eyes become ^ ^ (happy squint) on correct serve |

## Screen Layout (landscape)

```
[♥♥♥ Lives]                          [🪙 Score: 0000]

                                     [Customer 1 💬{🍅🥕}]
      🧑‍🍳        🍲                  [Customer 2 💬{🍄}]
     Chef       Pot                  [Customer 3 💬{🧅🥔🌶}]

 [🍅] [🥕] [🧅] [🍄] [🥔] [🌶]      [SERVE]
```

## Game Flow

1. Game starts with chef standing left of pot, first customer appears
2. Customer speech bubble shows 1-3 ingredient icons
3. Player taps ingredients — they arc-animate into pot, pot bubbles
4. Player taps SERVE — pot contents compared to customer order
5. Match = coins + happy reaction + next customer slides in
6. Mismatch = fewer coins + neutral reaction + pot empties + customer stays
7. Every 5 customers: new customer type appears
8. At coin thresholds: unlock broccoli (50 coins), corn (100 coins)
9. Session persists via localStorage (coins, unlocks)

## Sound (Web Audio)

- Chop: ingredient enters pot (short noise burst)
- Bubble: pot cooking (low rumble loop)
- Ding: correct serve (pleasant chime)
- Coin: coins earned (metallic tap)
- Whoosh: customer arrives/leaves
