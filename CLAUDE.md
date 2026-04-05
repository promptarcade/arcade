# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser game arcade at https://promptarcade.github.io/arcade/. Games are single HTML files deployed via GitHub Pages. No build tools — pure HTML/JS/Canvas.

## Common Commands

```bash
# Create a new game (auto-integrates into landing page)
bash tools/new-game.sh "Game Title" "Genre" "Description"           # lightweight template
bash tools/new-game.sh "Game Title" "Genre" "Description" --engine  # with visual engine

# Validate a game before pushing
bash tools/verify-game.sh games/<slug>/index.html

# Sprite generation
node tools/sprite-lab.js static tools/props/<name>.js --name <name> --style <style>
node tools/sprite-lab.js character [style]    # animated character sheet
node tools/sprite-lab.js profiles             # list style profile size requirements
node tools/sprite-lab.js verify               # check QA knowledge for known issues

# Always push after building — site auto-deploys via GitHub Pages
```

## Game Build Pipeline

Every game follows 4 steps. Steps 1 and 3 are **approval gates** — do NOT proceed without user approval.

### Step 1: Design Document (APPROVAL GATE)
Write a design doc covering: art style profile, game concept, complete entity list (with descriptions, canvas sizes, palettes), controls (keyboard + mobile touch). Open for user with `start ""`. Wait for approval.

Art style profiles:
- **Pixel** (16-36px) — retro, crispy edges
- **Chibi** (32-56px) — proportioned pixel art
- **Illustrated** (96-192px) — smooth curves, detailed
- **HD** (256px+) — painterly, maximum detail

### Step 2: Sprite Art (internal iteration)
For every entity in the design doc:
1. Check QA knowledge base: `node tools/sprite-lab.js verify`
2. Write custom draw function in `tools/props/<name>.js` using PixelCanvas primitives (`fillEllipse`, `fillRect`, `fillCircle`, `fillTriangle`, `hline`, `vline`, `setPixel`, `scatterNoise`). No `SpriteForge.character()` templates.
3. Render and validate: `node tools/sprite-lab.js static tools/props/<name>.js --name <name> --style <style>`
4. Read back PNG — if not instantly recognizable, fix and re-render.
5. Animated characters: use `sprite-lab.js character` or `SpriteForge.buildSheet()` with custom draw callbacks.

Sprite rules:
- Texture after shading (scatter noise AFTER `PostProcess.applyShading()`)
- Eyes after shading (use `drawPost` callback)
- Canvas sizes must meet style profile minimums
- Every entity needs: 4-tone hue-shifted palette, directional shading, tinted outlines

### Step 3: Present Sprites (APPROVAL GATE)
Open ALL rendered PNGs for user with `start ""`. Wait for approval.

### Step 4: Build Game
1. Build as single HTML file: `games/<game-name>/index.html`
2. Inline verified sprite drawing code from props/ scripts
3. Add card to `index.html` landing page (inside the `games-grid` div)
4. Run `bash tools/verify-game.sh games/<slug>/index.html`
5. Git commit and push
6. Update Supabase status if built from a request/suggestion

## Game Request Workflow

When the user says "check for game requests":

1. Fetch pending requests from Supabase:
   ```
   curl -s -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aHBxa3FuZnFjZ3JmcnN2c3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTg1NjYsImV4cCI6MjA4OTM5NDU2Nn0.x3X_0dbhw3Qz7sgQAgpSoSu382ckB2uYxCJGe7_vDCM" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aHBxa3FuZnFjZ3JmcnN2c3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTg1NjYsImV4cCI6MjA4OTM5NDU2Nn0.x3X_0dbhw3Qz7sgQAgpSoSu382ckB2uYxCJGe7_vDCM" "https://ivhpqkqnfqcgrfrsvszf.supabase.co/rest/v1/game_requests?status=eq.pending&order=created_at.asc&limit=1"
   ```

2. Update status to "building":
   ```
   curl -s -X PATCH -H "apikey: <key>" -H "Authorization: Bearer <key>" -H "Content-Type: application/json" -d '{"status":"building"}' "https://ivhpqkqnfqcgrfrsvszf.supabase.co/rest/v1/game_requests?id=eq.<REQUEST_ID>"
   ```

3. Follow the Game Build Pipeline above
4. Update status to "published":
   ```
   curl -s -X PATCH -H "apikey: <key>" -H "Authorization: Bearer <key>" -H "Content-Type: application/json" -d '{"status":"published","game_name":"<name>"}' "https://ivhpqkqnfqcgrfrsvszf.supabase.co/rest/v1/game_requests?id=eq.<REQUEST_ID>"
   ```
5. If from a community suggestion, mark implemented:
   ```
   curl -s -X PATCH -H "apikey: <key>" -H "Authorization: Bearer <key>" -H "Content-Type: application/json" -d '{"status":"implemented"}' "https://ivhpqkqnfqcgrfrsvszf.supabase.co/rest/v1/suggestions?message=ilike.*<GAME_NAME>*&status=eq.approved"
   ```
   Use the Supabase anon key for `<key>`.

## Architecture

- **`games/<slug>/index.html`** — Each game is a self-contained single HTML file with inline JS. No imports/exports.
- **`index.html`** — Landing page with game card grid, leaderboard dropdown, suggestion/bug-report system. New cards go INSIDE the `games-grid` div.
- **`engine/sprites/`** — SpriteForge v2 engine, QA knowledge base (`qa-knowledge.json`), verification PNGs.
- **`tools/sprite-lab.js`** — CLI for rendering and validating sprites via Node.js canvas.
- **`tools/sprite-lab-core.js`** — Shared rendering helpers: `renderPC()`, `renderSheet()`, `renderStatic()`, `renderComposite()`. Scales sprites 8x with game-scale insets.
- **`tools/props/`** — Per-entity draw functions used during sprite creation, then inlined into games.
- **`tools/template-engine.html`** / **`tools/template-standalone.html`** — Game templates with `{{TITLE}}`/`{{ENGINE}}` placeholder substitution.
- **`supabase/functions/`** — Edge Functions (Telegram webhook).

## Technical Constraints

- Games must work on GitHub Pages (static hosting, no server)
- Inline all engine code — remove `export`/`import` keywords
- Canvas sizing: fixed resolution + CSS `100vw`/`100vh` + SCALE/OX/OY math
- Use `bottomAlignFrame()` with oversized temp canvas for sprite generation
- When using `getCtx()` with a moving camera, call `pipeline.camera.applyTransform(ctx)`
- VFX particle params must be tuned for visibility — simulate arithmetic before committing values
- Each game card icon must visually summarise the game and be distinct from others

## Copyright & Naming

When a suggestion references a trademarked game (e.g. Tetris, Angry Birds), never use the original name. Build an original game inspired by the mechanics, with a unique name and distinct visual identity.

## Quality Standard

Do the real design work. Don't parametrize one approach and call variations "styles." If things should look different, write different code. Shortcuts in creative work produce mediocre results.
