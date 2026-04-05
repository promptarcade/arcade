# Ralph Character Training Loop — Agent Instructions

You are running one iteration of a character drawing training loop. The goal is to apply dragon eye rendering techniques to characters, testing whether they produce better results than previous flat-fill approaches.

## What to do

1. Read `ralph-training-characters/progress.txt` — absorb ALL lessons from previous iterations
2. Read `ralph-training-characters/PRD.md` — find the first unchecked exercise
3. Read these knowledge sources in PRIORITY ORDER:

   **ESSENTIAL (always read):**
   - `ralph-training-characters/iterations.md` — full history of this training run
   - `ralph-training-characters/last-critic.txt` — previous critic feedback (if exists)
   - `engine/sprites/qa-knowledge.json` — 85+ verified principles (including 41 from dragon eye training)

   **ESSENTIAL — Prior character research (EXTENSIVE — read before drawing):**
   - Memory: `reference_art_characters.md` — complete character reference: face construction, chibi template (rx=10, 4×4 eyes), two rendering approaches, animation data, commercial benchmarks
   - Memory: `feedback_character_faces.md` — CRITICAL: 10 failed face iterations documented. Faces ≠ props.
   - Memory: `feedback_face_shading_traps.md` — 3 specific traps: monkey-face chin, mustard pallor, shadow mouth. Working formula included.
   - Memory: `reference_art_gap_training.md` — levels 2-7 completed previously, 18 training scripts exist
   (Memory files are at: `C:/Users/U/.claude/projects/C--AI-Claude/memory/`)

   **ESSENTIAL — Dragon eye techniques to apply:**
   - `ralph-training/progress.txt` — ALL dragon eye discoveries
   - `ralph-training/self-assessment.md` — technique catalogue from dragon eye training
   - Memory: `reference_art_code_patterns.md` — proven code templates

   **IMPORTANT — Study existing character work:**
   - `tools/props/training/lvl5-3-complete-characters.js` — previous best character script
   - `tools/props/training/lvl3-1-body-greyscale.js` — body shading approach
   - `tools/props/training/lvl5-2-full-face.js` — face feature placement
   - `engine/sprites/verify/static-lvl5-3-complete-characters.png` — previous best output (the bar to EXCEED)

   **IMPORTANT — Dragon eye reference scripts:**
   - `ralph-training/props/ex7-full-dragon-eye.js` — the full dragon eye (best techniques)
   - `ralph-training/props/ex2-patch-scales.js` — zone-based rendering breakthrough

   **OPTIONAL:**
   - Memory: `reference_art_fundamentals.md` — 6 art fundamentals, 7 rendering principles
   - Memory: `reference_art_recipes.md` — character drawing recipes
   - Memory: `reference_art_construction.md` — silhouette-first method

4. Read the dragon eye reference images (QUALITY BAR — same standard for characters):
   - `360_F_654888806_uMYd2cIeIpUQ6wQYp6NMCsqAlRgucxQy.jpg` (red)
   - `360_F_1722554073_b8yysuYgbMaudi1rcIyzzHmDK1Oq5WUy.jpg` (green)
   - `360_F_1215749253_3LjW7zoQi2mcQqg0Rd3riLIYnHqtWzhx.jpg` (blue/purple)

5. Write a draw script in `ralph-training-characters/props/` from scratch
6. Render via `node tools/sprite-lab.js static <script> --name ralph-char-<name> --style hd --no-verify`
7. Read back the rendered PNG
8. Run the critic: `bash ralph-training-characters/critic.sh <png-path> '<description>' 2>&1 | tee ralph-training-characters/last-critic.txt`
9. If critic says FAIL: read the feedback, fix, re-render, re-critic. Max 5 attempts.
   CONTEXT WARNING: Don't re-read references between attempts — focus on fixing critic feedback.
10. When critic says PASS (or after 5 attempts): append TRANSFERABLE lessons to `ralph-training-characters/progress.txt`
    a. Narrative summary of what happened
    b. Add new principles to `engine/sprites/qa-knowledge.json` (verify JSON validity after editing)
    - Frame every lesson as transferable, not character-specific
    - Do NOT duplicate existing principles
11. Append iteration summary to `ralph-training-characters/iterations.md`
12. Git commit ONLY ralph-training-characters/ files, qa-knowledge.json, and engine/sprites/verify/static-ralph-char-*.png

## Dragon eye techniques to TEST on characters

- **Zone-based rendering** — 5 discrete tonal zones per form. Works on small domes (scales). Does it work on arms/torso/head?
- **Multi-pass pipeline** — interiors → boundaries → ridges → specular. Apply to body parts?
- **Per-form tonal sweep** — each body part gets its own full tonal range
- **Voronoi tessellation** — for hair? Hair strands as overlapping forms like scales?
- **Value hierarchy via tonal window capping** — face brightest, clothing mid, background recedes
- **Gamma 0.65** instead of S-curve for small forms
- **Range-band shifting** — body parts lit by global direction, shifted per-part
- **2 colour groups** for max tonal range per material

## Character-specific knowledge (from 10 failed iterations)

- Face = flat fill + features at 32px. BUT: this run should TEST whether dragon eye dome rendering changes that
- Eyes are the #1 feature — 4×4 on chibi head, build everything around them
- Hair wraps around head, drawn LAST, extends beyond head outline
- Chibi proportions: head rx=10 (62% width), body much smaller
- Working face bias formula: `if (ny > -0.2 && ny < 0.7 && abs(nx) < 0.55 && nz > 0.6) v = 0.5 + v * 0.5`
- 12 documented failure modes — read them before drawing

## Do NOT

- Assume flat-fill faces are the only option — TEST dragon eye techniques first
- Copy existing training scripts verbatim
- Skip the quality comparison step
- Mark an exercise done without running the critic
- Settle for lvl5-3 quality — that's the floor, not the ceiling
