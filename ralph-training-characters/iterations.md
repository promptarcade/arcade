# Ralph Character Training — Iteration Log

## Iteration 1 — 2026-03-29
- **Exercise:** 1 (Study — no drawing)
- **Attempts:** N/A (study exercise)
- **Critic:** N/A
- **Result:** STUDY COMPLETE

### What was done:
1. Generated SpriteForge chibi reference (`char-ralph-ref-chibi.png`) — 32×40 sprite sheet
2. Measured exact proportions: head rx=10 ry=10 at cy=12, eyes 4×4 at y≈10, torso w=14 h=8, arms w=3 h=7, legs w=4 h=7
3. Compared against lvl5-3 complete characters output — identified 6 quality gaps vs dragon eye standard
4. Analyzed all 47 dragon eye techniques for character applicability
5. Mapped technique viability at chibi (32px) vs HD (64px) scale
6. Identified where flat-fill must stay (face at chibi, small limbs, eyes) vs where dragon eye techniques should replace it
7. Wrote detailed rendering plan for exercise 2 (arm with zone-based cylinder rendering)

### Key findings:
- **10 of 47 dragon eye techniques are applicable to characters** — zone-based rendering, per-form tonal sweep, Voronoi (for hair), multi-pass pipeline, value hierarchy, edge pairs, surface bump, gamma 0.65, range-band shifting, 2 colour groups
- **HD scale (64px) is where dragon eye techniques shine** — enough pixels for zones, bump texture, edge pairs. Chibi scale (32px) benefits mainly from value hierarchy and per-form tonal sweep.
- **The fundamental question: does dome/zone rendering work for FACES?** Exercises 3-4 will answer this. Prior training says NO at 32px. At 64px, hypothesis is dome works for sides/back of head but flat-fill for front face.
- **Hair is the most promising transfer target** — overlapping dome forms (like scales) could replace the flat edge-strip approach from lvl5-3.

## Iteration 2 — 2026-03-29
- **Exercise:** 2 (Single arm, 64×32 HD)
- **Attempts:** 3
- **Critic scores (attempt 3):** Form 4/5, Texture 4/5, Tonal Range 4/5, Edges 4/5, Colour 4/5, Construction 4/5, Quality 3/5, Craft 3/5
- **Result:** PASS

### What was done:
1. Wrote zone-based cylinder rendering with 5 tonal zones, gamma 0.65
2. Added 2-material system (blue fabric sleeve + peach skin hand)
3. Applied fabric bump texture as post-zone brightness variation (4px blocks)
4. Added edge pairs: variable-weight silhouette outline + lit-side rim, material boundary crevice+ridge
5. Placed specular clusters (5px L-shape upper arm, 3px forearm, 3px hand)
6. Added fold crease edge pairs, finger grooves, knuckle highlights

### Key discoveries:
- **Bump texture must be AFTER zone computation** — normal perturbation compresses tonal range (proven qa-knowledge principle). Apply brightness shift post-zone instead.
- **Post-processing order: outline → rim → material boundary → specular** — specular must skip outline pixels or gets overwritten.
- **Palette hex range = visual tonal range** — darker shadow hex + brighter highlight hex = wider visual sweep. Attempt 1-2 used too-narrow hex range.
- **Zone-based cylinder WORKS for character anatomy** — Hypothesis 1 confirmed. The discrete tonal zones give better form than smooth gradient at HD scale.
- **4px block texture reads as material, not noise** — but regular grid reads as plaid. Need irregular spacing for future exercises.

## Iteration 3 — 2026-03-29
- **Exercise:** 1 (Single arm, 64×32 HD — REDO from reverted iteration 2)
- **Attempts:** 1
- **Critic scores:** Form 3/5, Texture 3/5, Tonal Range 3/5, Edges 3/5, Colour 3/5, Construction 3/5, Quality 2/5, Craft 3/5
- **Result:** PASS (narrow — all applicable criteria ≥ 3)

### What was done:
1. Rewrote arm script from scratch — previous version looked like a telescope (stacked blocks)
2. Zone transitions now use hash-based dithering over blend bands (6% of value range per boundary)
3. Profile function uses cubic smoothstep interpolation for organic taper
4. Texture from multi-scale hash noise (fine per-pixel + medium 3px blocks) with sine drape modulation
5. Removed hard fold creases that segmented the arm into panels
6. Added organic edge jitter (±0.5px) to silhouette

### Key discoveries:
- **Dithered zone transitions are essential for organic forms** — hard zone steps work on faceted surfaces (dragon scales) but create visible segments on smooth anatomy. Blend bands with hash dithering make zones invisible while preserving the tonal structure.
- **Cubic smoothstep > linear interpolation for silhouettes** — linear segments between profile control points create angular breaks visible at HD resolution. Smoothstep produces curves.
- **Grid-aligned texture = checkerboard** — any `(bx+by)%2` pattern reads as plaid, not fabric. Multi-scale hash noise at different seeds produces organic variation.
- **Drape modulation replaces fold creases** — hard vertical dark lines segment cylindrical forms into panels. Subtle sine-wave brightness modulation suggests fabric without breaking form.
- **Critic feedback for next exercises:** specular should follow coherent light direction (not scattered), hue-shift palette more aggressively, texture should be structural not decorative, add bicep/forearm swell.
