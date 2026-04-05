# Starlight Rescue — Design Document

## Concept
A text adventure where you play as Luna, a young apprentice starkeeper. The stars have gone out across the Moonlit Meadows and the woodland creatures are scared of the dark. Explore the meadows, find lost star fragments, solve puzzles to restore light, and rescue animals lost in the darkness.

Cute, heroic, funny. Luna is brave and resourceful. No combat — she outsmarts problems, helps creatures, and earns their trust.

## Input System — Cascading Button Menu

**No text input.** Everything is done through tappable buttons that cascade.

### How it works:
1. The screen shows 4-6 top-level action buttons at the bottom
2. Tapping one replaces the buttons with sub-options (can't go back — committed)
3. Sub-options may cascade further if needed
4. The final tap executes the command

### Example — "Go" action:
```
[Look] [Go] [Take] [Use] [Talk] [Ponder Life]
         ↓ tap "Go"
[North] [South] [East] [Into the bush face-first] [West] [Straight up]
         ↓ tap "North"
"You walk north into the Whispering Woods..."
```

### Example — "Use" action:
```
[Look] [Go] [Take] [Use] [Talk] [Juggle]
         ↓ tap "Use"
[Lantern] [Stick] [Your charm] [Star Fragment] [Interpretive dance]
         ↓ tap "Lantern"
[On the bush] [On the pond] [On your nose] [On the mysterious rock]
         ↓ tap "On the bush"
"You hold the lantern near the bush. A tiny nose peeks out..."
```

### The silly options:
Every menu level includes 1-3 joke options that do nothing useful but give funny responses. These should be:
- Context-aware (different per room/situation)
- Age-appropriate humour (silly, absurd, slapstick)
- Never mean-spirited
- Occasionally give very subtle hints disguised as jokes
- Some running gags that evolve through the game

Examples of silly options:
- **Actions**: "Ponder Life", "Do a little dance", "Juggle", "Sneeze dramatically", "Ask the moon for directions", "Try to look cool"
- **Go directions**: "Into the bush face-first", "Straight up", "In circles", "Wherever the wind takes you"
- **Use targets**: "On your nose", "As a hat", "Your winning smile", "Your impressive collection of lint"
- **Talk targets**: "To yourself", "To the rock (it's shy)", "To your shoes"

### Funny responses for silly choices:
- "You do a little dance. The wildflowers seem impressed. Nothing else happens."
- "You try to go straight up. Gravity disagrees. You land in the flowers."
- "You use the stick as a hat. It's not comfortable. The frog gives you a look."
- "You talk to the rock. It says nothing. Classic rock behaviour."
- "You sneeze dramatically. A butterfly startles. You feel powerful."
- "You ask the moon for directions. It stares at you. Moons are terrible at conversation."
- Rare: "You try to look cool. The owl nods approvingly. You've peaked."

### Button behaviour:
- Once tapped, a button is gone — you can't undo mid-cascade
- But you can always do another action immediately after (no penalty)
- Buttons animate in with a gentle bounce
- Correct/useful actions glow slightly warmer
- Silly options have a slightly different style (italic? sparkle? ) to hint they're jokes without giving it away

## Game World

### Zone 1: Moonlit Meadow (start)
1. **Your Cottage** — home. Starkeeper's lantern here. Cosy.
2. **Flower Meadow** — wildflowers, brook. Frightened **bunny** under a bush.
3. **Old Stone Bridge** — star fragment in the ivy underneath.
4. **Willow Pond** — weeping willow, still pond. **Frog** stuck on drifted lily pad.
5. **Meadow Gate** — locked gate to the woods. Flower puzzle.

### Zone 2: Whispering Woods
6. **Forest Entrance** — tall dark trees, glowing mushrooms.
7. **Hollow Oak** — huge hollow tree. **Owl** lives here, won't talk until you bring something shiny.
8. **Toadstool Ring** — fairy ring. Use lantern here to reveal a star fragment.
9. **Tangled Thicket** — brambles block east. Bunny can squeeze through.
10. **Mossy Clearing** — soft moss, fallen log. **Hedgehog** shivering, needs blanket.

### Zone 3: Crystal Caves
11. **Cave Mouth** — entrance, dripping water.
12. **Crystal Hall** — crystal pillars. Star fragment trapped in crystal.
13. **Underground Stream** — **fish** trapped in cut-off pool.
14. **Echo Chamber** — say the right word to open passage.
15. **Glowing Grotto** — bioluminescent moss. Two fragments, one across a gap.

### Zone 4: Starfall Summit
16. **Mountain Path** — winding upward. Hedgehog knows shortcut.
17. **Cloud Terrace** — above treeline. **Kitten** stuck on ledge.
18. **Star Pool** — use fragments here to relight them.
19. **Summit** — last fragment too high. Owl retrieves it.
20. **Sky Garden** — epilogue. All animals gather when stars restored.

## Puzzles
1. Bunny rescue — use lantern on bush. She follows you.
2. Bridge fragment — examine bridge, take fragment from ivy.
3. Frog rescue — find stick in woods, use on pond to push lily pad.
4. Gate puzzle — arrange flowers (frog tells you the pattern).
5. Owl trust — bring crystal shard from caves.
6. Hedgehog — bring blanket from cottage. Tells you mountain shortcut.
7. Crystal fragment — frog spits water at crystal to crack it.
8. Echo puzzle — owl tells you the word is "starlight".
9. Fish rescue — use stick to lever stones, reconnect pool.
10. Kitten rescue — bunny lures kitten down.
11. Summit fragment — owl retrieves it.
12. Star restoration — use fragments at Star Pool.

## UI Layout
```
┌──────────────────────────────────┐
│  ☆ ☆ ☆ ☆ ☆ ☆ ☆ ☆  (star bar)  │  <- fills in as stars found
│                                  │
│  Story text scrolls here         │
│  with room descriptions,         │
│  responses to actions,           │
│  dialogue from animals.          │
│                                  │
│  Vivid, warm descriptions.       │
│  Funny responses to silly        │
│  actions.                        │
│                                  │
│──────────────────────────────────│
│  [Inventory: Lantern, Stick]     │  <- compact item list
│  [Animals: Bunny, Frog]          │  <- rescued companions
│──────────────────────────────────│
│                                  │
│  [Look] [Go] [Take] [Use]       │  <- action buttons
│  [Talk] [Do a little dance]      │
│                                  │
└──────────────────────────────────┘
```

- Background: deep navy gradient, subtle twinkling
- Text: warm cream/gold on dark
- Buttons: rounded, soft glow, bounce animation on appear
- Star bar at top fills with golden stars as fragments are placed
- When a star is restored: screen flashes warm gold briefly

## Tone
- Second person: "You step into the meadow."
- Warm, encouraging. Never punishing.
- Wrong actions: gentle humour, not "you can't do that"
- Animals have personality: bunny=shy, frog=cheeky, owl=wise, hedgehog=grumpy-kind, fish=grateful, kitten=playful
- 2-3 sentences per room description
- Star restoration moments are celebratory

## No Sprites Needed
Pure HTML/CSS/JS text adventure. The visual appeal comes from:
- Beautiful typography
- Soft colour palette (navy, silver, lavender, gold)
- Star animations in the background
- Button animations
- Text appearing with gentle fade-in

## Technical
- Single HTML file
- Save to localStorage
- No fail state, no death, no timer
- Mobile-first — buttons sized for iPad touch
- Responsive layout
