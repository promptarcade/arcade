# Art Training Session — Continuation Prompt

Give this to a new Claude Code session:

---

## Prompt

I've been building up your drawing skills across multiple sessions. There's a comprehensive training system in memory — read it all before doing anything.

### What to read first:
1. `reference_art_training.md` — the 8-phase training plan. Phases 1-6 are complete. Phase 7 is partially done (7.1 potion complete, 7.2-7.5 remaining). Phase 8 (game production) not started.
2. `reference_art_fundamentals.md` — the core drawing principles (form, light, colour, construction)
3. `reference_art_recipes.md` — how to draw specific subject types
4. `reference_art_construction.md` — the silhouette-first method (the most important discovery)
5. `reference_art_code_patterns.md` — copy-paste code templates for common operations
6. `feedback_art_quality_bar.md` — my specific quality expectations
7. `engine/sprites/qa-knowledge.json` — 25+ accumulated principles from training

### What to do:

**Step 1: Finish Phase 7 (write your own scripts, don't copy the existing ones)**
- 7.2: Character portrait at Illustrated tier
- 7.3: Terrain tile set (grass, dirt, water, stone — must tile seamlessly)
- 7.4: Full scene (character + environment + props + lighting)
- 7.5: Dragon eye final exam

For each exercise: silhouette first → verify → shade. Log findings to qa-knowledge.json.

**Step 2: Fix known issues from Phase 6C**
- The pie (p6c-6) has the wrong viewing angle — needs elevated 3/4 view, not side-on
- These exist in tools/props/training/ — fix and re-render

**Step 3: Research and develop Phase 9 — Production Variety**

This phase doesn't exist yet. It needs to be researched and designed. The gap it fills: I can draw good individual objects but haven't proven I can draw a complete game's worth of assets that are all:
- Consistent in style (same lighting, same viewing angle, same palette approach)
- Diverse in subject (characters, props, terrain, UI, effects)
- Functional at game scale (readable at the size they'll actually appear in-game)

Research topics for Phase 9:
- How do professional indie studios maintain visual consistency across large sprite sets?
- What's the standard workflow for creating a full game's sprite sheet?
- How do you design a colour palette that works across dozens of different objects?
- What are the minimum asset types a game needs (characters, props, terrain, UI, effects)?

Design exercises that specifically train:
- **Character variety** — same style, different characters (body types, clothing, hair)
- **Character poses** — same character in idle, walk, attack, hurt, death
- **Style consistency test** — draw 8 completely different objects that all look like one game
- **Tile connectivity** — terrain tiles that seamlessly connect at edges
- **UI set** — buttons, panels, health bar, inventory, text box in matching style
- **Scale testing** — render at game resolution, verify readability

**Step 4: Run Phase 8 — build the Soup Shop game**

The community suggestion for a soup cooking game is still in the approved queue. Build it using the trained skills. This is the real test — all trained skills applied to a shippable product.

Design doc is at `games/soup-shop/design.md`. Art style should be HD tier.

Follow the game build pipeline in CLAUDE.md. Silhouette-first for every sprite. Verify before shading. Present sprites for my approval before building the game.

### Critical rules:
- **Don't skip steps.** The training is sequential for a reason.
- **Write your own scripts from scratch.** Existing training scripts in tools/props/training/ are answer keys — attempt first, compare after.
- **Silhouette before shading.** Every object starts as a flat fill. If the shape doesn't read, no shading.
- **Don't hedge on quality.** The engine can set any pixel. The quality ceiling is design skill, not tool limitation.
- **Log everything to qa-knowledge.json.** Future sessions benefit from your findings.
- **Present work honestly.** When showing me a rendered sprite: show the image without positive pre-framing, list what's wrong BEFORE what's right, and don't default to "pass" when you're unsure. Read `feedback_honest_assessment.md`. Overselling your own output wastes my time as QA reviewer — I end up catching problems you already saw but didn't flag. If it's not good enough, say so before I have to.

---
