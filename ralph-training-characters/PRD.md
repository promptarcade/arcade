# Character Drawing Training — Ralph Loop

## Goal

Apply dragon eye rendering techniques to character sprites. The dragon eye training produced 41 principles for rendering quality (zone-based rendering, per-form tonal sweeps, Voronoi coverage, multi-pass pipeline). Test whether these techniques produce BETTER characters than the flat-fill approach that previous training settled on.

## Quality Reference

Before marking ANY exercise complete, the CRITIC must PASS it.

1. Render via `node tools/sprite-lab.js static <script> --name <name> --style hd --no-verify`
2. Run critic: `bash ralph-training-characters/critic.sh <png-path> '<description>'`
3. If FAIL: fix, re-render, re-critic. Max 5 attempts. Max 3 ITERATIONS per exercise.
4. Append transferable lessons to `ralph-training-characters/progress.txt`
5. Mark exercise done only on PASS

Reference images for quality comparison:
- Dragon eye references (THE quality bar — same standard applies to characters):
  - `C:/AI/Claude/360_F_654888806_uMYd2cIeIpUQ6wQYp6NMCsqAlRgucxQy.jpg` (red dragon)
  - `C:/AI/Claude/360_F_1722554073_b8yysuYgbMaudi1rcIyzzHmDK1Oq5WUy.jpg` (green dragon)
  - `C:/AI/Claude/360_F_1215749253_3LjW7zoQi2mcQqg0Rd3riLIYnHqtWzhx.jpg` (blue/purple dragon)
- The dragon eye references ARE the quality standard — apply those rendering principles to characters

## Exercises

Progressive — start by testing dragon eye techniques on character body parts, then faces, then full characters.

- [x] 1. **Single arm** (64×32 HD) — PASSED iteration 3. Zone boundaries now wrap around cylinder cross-section with dithered transitions. Organic cubic taper, irregular hash texture. Reads as an arm, not a telescope. Narrow pass (all 3/5). TRANSFERABLE: Soft zone transitions via dithered blend bands, cubic profile functions for organic taper, irregular multi-scale hash noise for texture.

- [ ] 2. **Torso** (64×64 HD) — Character torso (shirt/tunic). Cylinder lighting + fabric texture. Collar, fold lines, belt as detail elements. Zone-based rendering on the fabric. TRANSFERABLE: Clothing rendering at game scale. Fabric vs metal vs skin material distinction.

- [ ] 3. **Head — body-style rendering** (64×64 HD) — Attempt a character head using the dragon eye sphere/dome approach. Hair as overlapping forms (like scales). Skin as a smooth dome with subtle texture. See if this works or if it fails like the previous 10 face iterations. TRANSFERABLE: Does dome lighting work for faces when combined with zone-based rendering? Or does flat-fill remain correct?

- [ ] 4. **Head — hybrid approach** (64×64 HD) — If exercise 3 fails: face as flat fill + features, BUT hair and back-of-head use dragon eye techniques (overlapping dome forms like scales). Body-quality rendering where it works, flat-fill where it doesn't. TRANSFERABLE: Where exactly is the boundary between prop rendering and face rendering?

- [ ] 5. **Full character at HD scale** (64×96 HD) — Complete character using the best approach from exercises 1-4. Head + torso + arms + legs. Everything rendered at dragon-eye quality where possible. TRANSFERABLE: Full character construction pipeline with quality rendering.

- [ ] 6. **Full character at game scale** (32×48 chibi) — Same character scaled down to actual game size. Which details survive? What needs simplification? TRANSFERABLE: How to adapt HD rendering to game-resolution sprites. What to keep, what to cut.

- [ ] 7. **Three distinct characters** (32×48 each) — Different hair, clothes, body shape. Each identifiable from silhouette. All consistent style. TRANSFERABLE: Character differentiation and set consistency.

- [ ] 8. **Walk cycle** (4 frames, 32×48) — Frame 0→1→0→2 pattern. Volume constant across frames. TRANSFERABLE: Animation fundamentals. Volume preservation.

- [ ] 9. **Character + environment** (160×120) — Character standing in a scene (kitchen, dungeon, field). Character is focal point. Background recedes. TRANSFERABLE: Character-environment integration. Value hierarchy in a scene.

- [ ] 10. **Self-assessment** — Compare all outputs against references and lvl5-3. Write gap analysis. Catalogue every transferable technique for character rendering.

## Rules

- ONE exercise per iteration (max 3 iterations per exercise)
- Read progress.txt at the start of EVERY iteration
- DO NOT assume faces need flat fill — TEST whether dragon eye techniques work first (exercises 3-4)
- The critic uses the dragon eye references as the quality bar
- EVERY lesson must be TRANSFERABLE
- Previous character training settled for mediocre quality by giving up on lighting. This run pushes further.
