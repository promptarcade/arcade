# Ralph Training Loop — Agent Instructions

You are running one iteration of a dragon eye drawing training loop. The goal is to learn TRANSFERABLE drawing techniques by building up to a complete dragon eye.

## What to do

1. Read `ralph-training/progress.txt` — absorb all lessons from previous iterations
2. Read `ralph-training/PRD.md` — find the first unchecked exercise
3. Read knowledge sources in this PRIORITY ORDER (stop if context is getting large):
   **ESSENTIAL (always read):**
   - `ralph-training/iterations.md` — full history of every iteration, scores, and discoveries
   - `ralph-training/last-critic.txt` — previous critic feedback (if exists)
   - `engine/sprites/qa-knowledge.json` — 45+ verified principles
   - Memory file: `reference_art_code_patterns.md` — COPY-PASTE code templates (in `C:/Users/U/.claude/projects/C--AI-Claude/memory/`)

   **IMPORTANT (read for the current exercise type):**
   - `tools/props/training/p5-6-scales.js` — study how scales were rendered (exercises 1-3, 7-9)
   - `tools/props/training/p7-5-dragon-eye.js` — study the previous dragon eye (exercises 6-9)
   - `tools/props/training/p1-1-sphere.js` — study sphere lighting (exercises 1, 3)
   - Memory file: `reference_art_fundamentals.md` — 7 rendering principles

   **OPTIONAL (if context allows):**
   - Memory file: `reference_art_recipes.md` — creature/material recipes
   - Memory file: `reference_art_construction.md` — silhouette-first method
   - `engine/sprites/style-profiles.js` — style tier constraints
4. Read ALL THREE dragon eye reference images:
   - `360_F_654888806_uMYd2cIeIpUQ6wQYp6NMCsqAlRgucxQy.jpg` (red)
   - `360_F_1722554073_b8yysuYgbMaudi1rcIyzzHmDK1Oq5WUy.jpg` (green)
   - `360_F_1215749253_3LjW7zoQi2mcQqg0Rd3riLIYnHqtWzhx.jpg` (blue/purple — iridescent)
   Study them carefully. Note what makes them high quality.
5. Write a draw script in `ralph-training/props/` from scratch
6. Render via `node tools/sprite-lab.js static <script> --name <name> --style hd --no-verify`
7. Read back the rendered PNG
8. Run the critic: `bash ralph-training/critic.sh <png-path> '<exercise description>'`
9. If critic says FAIL: read the feedback, fix the script, re-render, re-critic. Max 5 attempts.
   CONTEXT WARNING: Each critic round-trip is expensive. Don't re-read the reference images or knowledge files between attempts — you already have them in context. Focus on reading last-critic.txt, fixing the specific issues, re-rendering, and re-running the critic.
10. When critic says PASS (or after 5 attempts), log lessons to BOTH locations:
    a. Append to `ralph-training/progress.txt` — narrative summary of what happened, what the critic said, what you fixed
    b. Add new principles to `engine/sprites/qa-knowledge.json` — any TRANSFERABLE technique discovery goes here as a new entry in the "principles" array (format: `{"issue": "...", "fix": "...", "promotedFrom": "ralph-training-exN", "hitCount": 1, "promoted": "YYYY-MM-DD"}`). Also increment `_meta.entryCount`. After editing, verify the JSON is valid with `node -e "JSON.parse(require('fs').readFileSync('engine/sprites/qa-knowledge.json','utf8'))"`. This is the CANONICAL knowledge base that all future sessions read — a malformed file breaks everything.
    - Frame every lesson as applicable to ANY subject, not just dragon eyes
    - e.g. "Curved textured surfaces need per-element lighting" not "Dragon scales need lighting"
    - Do NOT duplicate existing principles — check qa-knowledge.json first
11. Update `ralph-training/PRD.md` — check off the exercise (only if critic PASSED)
12. Append an iteration summary to `ralph-training/iterations.md`: iteration number, date, exercise attempted, attempts made, critic scores per criterion, PASS/FAIL, key discoveries. This is the permanent training record.
13. Git commit ONLY ralph-training/ files and qa-knowledge.json — do NOT `git add -A` or commit unrelated changes
    `git add ralph-training/ engine/sprites/qa-knowledge.json engine/sprites/verify/static-ralph-*.png && git commit -m "ralph training: exercise N"`
13. Output `<promise>COMPLETE</promise>` when done

## Quality comparison checklist (check ALL against dragon eyes)

- [ ] Every surface has texture — no smooth banded gradients
- [ ] Each form has its own full tonal range (highlight to shadow)
- [ ] Edges define forms — dark crevices, bright ridges
- [ ] Specular highlights are tiny and extreme contrast
- [ ] No empty space — every pixel is a rendered surface
- [ ] Colour is consistent (a red thing reads RED throughout)
- [ ] Overall craft matches the reference level

## Do NOT

- Copy existing training scripts verbatim — study them, understand the technique, then write your own
- Skip the quality comparison step
- Mark an exercise done without running the critic
- Use canvases smaller than 128x96 for HD-tier props
- Ignore the proven code patterns in reference_art_code_patterns.md — they are TESTED and WORKING
- Ignore the rendering principles in reference_art_fundamentals.md — especially the 7 rendering principles from reference studies

## Key proven techniques to USE

- **drawPost for all manual lighting** — outlineMode: 'none', all drawing in drawPost callback
- **tone(group, 0-1) helper** — maps float to palette index
- **S-curve contrast**: `v * v * (3 - 2 * v)` — essential for tonal separation
- **Sphere normals**: `nx = dx/r, ny = dy/r, nz = sqrt(1 - nx² - ny²)`
- **Cylinder normals**: `nx = dx/halfW, nz = sqrt(1 - nx²)` (no ny)
- **Dual palette crossfade**: warm group for lit, cool group for shadow, switch at v threshold
- **Tight packing**: row spacing < form height, small jitter (30%), dark crevice base
- **Bump texture**: perturb normals with hash-based noise to break banding
- **sf2_seededRNG(seed)**: available globally for reproducible random
