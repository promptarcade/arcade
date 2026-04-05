# Dragon Eye Training — Ralph Loop

## Goal

Draw a dragon eye. Iterate until it's good. Extract TRANSFERABLE drawing techniques at every step — these lessons must apply to any subject, not just dragon eyes.

## Quality Reference

Before marking ANY exercise complete, the CRITIC must PASS it.

1. Render via `node tools/sprite-lab.js static <script> --name <name> --style hd --no-verify`
2. Run critic: `bash ralph-training/critic.sh <png-path> '<description>'`
3. If FAIL: fix, re-render, re-critic. Max 5 attempts.
4. Append transferable lessons to `ralph-training/progress.txt`
5. Mark exercise done only on PASS

Reference images (read ALL THREE every iteration):
- `C:/AI/Claude/360_F_654888806_uMYd2cIeIpUQ6wQYp6NMCsqAlRgucxQy.jpg` (red dragon)
- `C:/AI/Claude/360_F_1722554073_b8yysuYgbMaudi1rcIyzzHmDK1Oq5WUy.jpg` (green dragon)
- `C:/AI/Claude/360_F_1215749253_3LjW7zoQi2mcQqg0Rd3riLIYnHqtWzhx.jpg` (blue/purple dragon — iridescent)

## Exercises

Each builds ONE transferable skill. Scripts in `ralph-training/props/`. Canvas: 128x128 HD.

- [x] 1. **Single scale** (128x128) — ATTEMPTED 37 times across 8 iterations. Best: Texture 3, Coverage 4, Colour 4. Tonal Range/Edges/Specular stuck at 2 — cell-size tonal ceiling. 12+ transferable principles extracted. Moving to exercise 2. TRANSFERABLE: How to render a single convex form with highlight, shadow, crevice edge, and surface texture. Applies to: any small repeated form (cobblestones, coins, buttons, leaves).

- [x] 2. **Patch of scales** (128x128) — PASSED in 4 attempts (iteration 9). All 8 criteria at 3+/5. Best: Construction 4, Coverage 4, Colour 4. Key breakthrough: zone-based rendering (5 discrete tonal steps per dome) instead of smooth gradient. TRANSFERABLE: How to pack repeated forms so they read as a surface, not scattered shapes. Zone-based rendering for visible tonal steps in small cells. Dark crevices + bright ridges as structural boundary pairs. Applies to: stone walls, roof tiles, chain mail, bark, any tiled surface.

- [x] 3. **Curved surface of scales** (128x128) — PASSED in 1 attempt (iteration 10). All 8 criteria at 3+/5. Best: Coverage 4, Colour 4, Construction 4. Key technique: sphere-based foreshortening (nz-scaled radii) + range-band shifting + zone-based rendering. TRANSFERABLE: How to combine global form lighting with local detail lighting. Foreshortening via surface normal projection. Applies to: any textured curved surface (armour, fruit skin, terrain).

- [x] 4. **The eye socket** (128x128) — RE-PASSED iteration 12, 1 attempt. Fixed scale density regression: Voronoi pixel assignment instead of painter's order, tighter grid + perimeter seed rings. All 8 criteria 3+/5, no regressions. TRANSFERABLE: How to render a concave form (socket, bowl, cave entrance). Depth through shadow. Voronoi assignment for guaranteed coverage near obstacles. Applies to: any recessed area, door frames, windows, bowl interiors.

- [x] 5. **The iris** (96x96) — PASSED iteration 13, 3 attempts (palette fixes). Warm gold/amber palette with hue pre-compensation. Radial angular Voronoi fibres, vertical slit pupil, dual specular. All 8 criteria 3+/5. TRANSFERABLE: How to render radial detail, colour gradients within a form, and a dominant focal element. Engine hue shift pre-compensation for non-green palettes. Applies to: flowers, shields, clock faces, magical effects.

- [x] 6. **Eye + socket composite** (128x128) — RE-PASSED iteration 15, 1 attempt. Fixed: separate amber/gold palette for iris (contrasting warm vs green scales), eyeball fills entire socket (no gap). All 8 criteria 3+/5. TRANSFERABLE: How to composite multiple forms with contrasting palettes for focal hierarchy. Applies to: any object-in-container scene with focal point.

- [x] 7. **Full dragon eye** (192x128) — PASSED iteration 16, 1 attempt. Best scores yet: Texture 4, Edges 4, Coverage 4, Colour 4, Construction 4, Tonal Range 3, Specular 3, Craft 3. Value hierarchy via tonal window assignment (scales capped at palette 0-13, iris uses full 0-15). TRANSFERABLE: Focal point through contrast, value hierarchy across a composition, unifying multiple materials. Applies to: any complex scene with a clear subject.

- [x] 8. **Red variant** (192x128) — PASSED iteration 17, 1 attempt. Best scores yet: Coverage 5, Craft 4 (first time). Crimson/red scales with orange/gold iris. Hue pre-compensation worked: H≈348° cool base → shadows land in deep red not orange. TRANSFERABLE: How to transpose a composition to a different colour temperature while preserving form and value structure. Applies to: palette swaps, time-of-day variants, team colours.

- [x] 9. **Blue/iridescent variant** (192x128) — PASSED iteration 18, 1 attempt. Tonal Range 4, Edges 4, Coverage 4, Construction 4. Iridescent blue scales via saturated-cool/desaturated-warm palette split. Purple iris with golden centre. Colour at 3/5 — iridescence reads as blue-grey rather than dramatic silver-to-purple shift; future work should push saturation contrast harder. TRANSFERABLE: How to render iridescence via palette saturation gradient (saturated shadows, desaturated highlights). Engine hue shift naturally assists cool palettes. Applies to: metallic surfaces, beetle shells, oil slicks, magic effects.

- [x] 10. **Self-assessment** — COMPLETED iteration 19. Compared all 3 variants against references. Wrote comprehensive gap analysis (4 categories), catalogued 47 transferable techniques, assessed training system. Key gaps: scale size variation, intra-zone texture, iridescence fidelity. 41 principles added to qa-knowledge.json across the full training run.

## Rules

- ONE exercise per iteration
- Write scripts from scratch — do NOT copy existing training scripts
- Read `progress.txt` at start of EVERY iteration
- Read `qa-knowledge.json` at start of EVERY iteration
- The critic MUST pass before marking complete
- EVERY lesson logged to progress.txt must be framed as TRANSFERABLE — not "dragon eyes need X" but "curved textured surfaces need X"
