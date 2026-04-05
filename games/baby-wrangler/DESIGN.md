# Baby Wrangler — Design Document

## Concept
A mother catches her baby before it grabs dangerous household objects. The baby escapes its playpen and crawls toward hazards. The player must pick up the baby and return it to the playpen, or collect hazards before the baby reaches them.

## Core Mechanics
- Player (mother) moves around a living room
- Baby escapes playpen on a timer, crawls toward most dangerous nearby hazard
- Catch baby on contact, carry back to playpen for points
- Walk over hazards to remove them (+10 points)
- If baby holds a hazard too long, lose a life
- 3 lives, waves escalate (baby faster, more hazards, shorter escape timer)
- Streak bonus for catching baby before it grabs anything

### Why the mother can't just camp the playpen
- **Hazards must be collected** — they spawn at room edges and the baby targets them. If you don't collect hazards, the baby will always find one. Standing at the playpen means hazards pile up.
- **Chores** — periodically a chore appears (doorbell rings, phone rings, oven timer) at a specific spot in the room. Completing it gives bonus points and briefly slows hazard spawning. Ignoring it speeds up spawning.
- **Furniture blocks movement** — sofa, coffee table, bookshelf, TV stand are solid obstacles the mother must walk around. The baby can crawl under/through furniture (it's small). This means the mother can't take a direct path.
- **Multiple hazards at once** — at higher waves, 3-4 hazards exist simultaneously. You need to collect the dangerous ones before the baby reaches them, which means leaving the playpen area.

## Controls
- Keyboard: Arrow keys / WASD
- Touch: tap/drag to move toward touch point
- M to mute

## Room Layout
The room should feel like a real living room, not an empty box. It should be sized to fit the screen without excessive empty space.

**Room sizing**: max 600px wide, max 450px tall, centered on screen. On wide screens the room doesn't stretch — it stays a fixed aspect ratio with margins.

### Visual Entities

#### Characters
| Entity | Description | Canvas Size | Palette |
|--------|------------|-------------|---------|
| Mother | Woman with flowing brown hair, pink bow, pink A-line dress with apron, puff sleeves, mary jane shoes. Eyelashes, blush, earrings. | 32x48 | skin:#f5d0a9, hair:#7a4422, dress:#dd5577, apron:#f5f0e0, shoes:#884433, eyes:#448855, lips:#dd7788 |
| Father | Man with short brown hair, green polo shirt, khaki shorts, sneakers. Slightly taller/broader than mother. | 32x48 | skin:#f0c898, hair:#5a3820, shirt:#558855, shorts:#aa9966, shoes:#665533, eyes:#446644 |
| Baby (sitting) | Large round head, blue onesie, hair tuft, arms out, feet forward. Blinks. | 16x20 | skin:#ffe0cc, hair:#ddaa66, onesie:#88ccff, eyes:#445533 |
| Baby (crawling) | Horizontal body, head facing right, bum raised, round knees, reaching arms. | 32x20 | same as sitting |

#### Parent Selection
- Title screen shows both parents side by side — tap/click to choose who you control
- The selected parent is player-controlled (full speed, keyboard/touch)
- The other parent is AI-controlled:
  - Moves at 60% speed
  - Automatically walks to chores and completes them
  - Automatically walks to nearby hazards and picks them up
  - Will NOT pick up the baby — that's the player's job
  - Pathfinds around furniture (simple: walks toward target, slides along obstacle edges)
  - Has a small thought bubble showing what they're heading toward (chore icon or hazard icon)

#### Furniture
Furniture marked SOLID blocks the mother's movement. The baby crawls under/through everything (it's small).

| Entity | Solid? | Description | Canvas Size | Palette |
|--------|--------|------------|-------------|---------|
| Sofa | YES | Blue 3-seater with cushion lines, arms, throw pillow. Against top wall. | ~120x40px drawn | blues #5566aa/#6677bb |
| Coffee table | YES | Wooden rectangle with lighter top, mug on it. Center-left area. | ~60x30px drawn | browns #8b6914/#a07828 |
| Bookshelf | YES | 4 shelves against right wall with colored books | ~20x80px drawn | brown #8b6914, books multicolor |
| TV stand | YES | Low cabinet against bottom wall with flat TV | ~80x25px drawn | dark wood #554433, TV #222222 |
| Rug | no | Oval patterned rug under/around playpen | ellipse | warm brown rgba |
| Window | no | Rectangle with blue sky, cross frame, curtains. On top wall. | ~80x50px drawn | blue #aaccee, curtains #cc8866 |
| Potted plant | no | Terracotta pot with green leaf cluster. Corner. | ~20x30px drawn | pot #aa6633, leaves #44aa44 |
| Floor lamp | no | Tall lamp in corner with warm shade | ~10x60px drawn | pole #888888, shade #ddcc88 |
| Wall art | no | Small framed picture on wall | ~20x15px drawn | frame #8b6914 |
| Toy box | no | Colorful box with toys spilling out, near playpen | ~30x20px drawn | box #dd4444, toys multicolor |

#### Chore Events
Periodically a chore indicator appears at a location in the room. Walk to it and stand for 1 second to complete.

| Chore | Location | Points | Effect |
|-------|----------|--------|--------|
| Doorbell | Left wall edge | 50 | Slows hazard spawn for 10s |
| Phone ringing | On coffee table | 30 | Slows hazard spawn for 8s |
| Oven timer | Bottom-right corner | 40 | Slows hazard spawn for 10s |
| Spill cleanup | Random floor spot | 25 | Removes nearest hazard |

One chore active at a time. Appears every 15-20 seconds. If ignored for 10 seconds, it disappears and hazard spawn rate increases briefly.

#### Hazards (spawn at room edges, emoji-based)
Scissors ✂️, Hot Coffee ☕, Glass Vase 🏺, Marker 🖊️, Phone 📱, Remote 📺, Keys 🔑, Plant 🌱, Candle 🕯️

#### Playpen
Oval rug base with vertical bar posts around the edge. Escape timer arc indicator.

### Room Drawing Order (back to front)
1. Floor (wooden boards)
2. Walls + baseboard
3. Window + curtains (on top wall)
4. Wall art (on walls)
5. Bookshelf (against right wall)
6. Rug (on floor)
7. TV stand (against bottom wall)
8. Floor lamp (in corner)
9. Sofa (against top wall)
10. Coffee table (between sofa and playpen)
11. Toy box (near playpen)
12. Potted plant (corner)
13. Playpen
14. Hazards, baby, parent (y-sorted)

## HUD
- Lives (hearts) top-left
- Score center-top
- Wave number below score
- High score top-right
- Mute indicator
