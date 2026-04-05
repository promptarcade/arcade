# Shattered Realm — Design Document

## Concept
A Kenshi-inspired open-world squad RPG set in a dark fantasy realm. You start as a lone wanderer — recruit companions, build outposts, train skills through use, survive hostile factions and creatures. No hand-holding, no chosen-one narrative. Just a brutal world and your will to carve out a place in it.

## Art Style
**Pixel** (24x32 characters) — matching Castle Run knight scale. Retro, readable at small size. Top-down with slight angle (like classic Zelda/early Ultima).

## Core Mechanics

### Squad Management
- Control 1-8 characters simultaneously
- Click to select, drag-box to multi-select, number keys for groups
- Right-click to move/attack/interact
- Each character has independent stats, inventory, and job assignment

### Skills (Improve Through Use)
- **Combat**: Melee, Ranged, Defence (level up by fighting)
- **Survival**: Athletics (running), Toughness (taking hits), First Aid
- **Labour**: Mining, Woodcutting, Farming, Cooking, Building
- **Crafting**: Smithing, Armour-making, Engineering

### World
- Procedurally arranged zones: Greenfields (start), Dark Forest, Badlands, Swamphollow, Frozen Peaks, Ashlands
- Each zone has faction territories, resources, dangers
- Day/night cycle affects visibility and enemy spawns
- Weather: rain (slows movement), fog (reduces vision)

### Base Building
- Claim territory, place structures from a build menu
- Structures: Campfire, Storage Chest, Walls, Gate, Workbench, Forge, Farm Plot, Watchtower, Bed
- Assign characters to jobs (farm, craft, guard, patrol)

### Combat
- Real-time, auto-attack when enemies in range
- Melee characters close distance, ranged stay back
- Knockdown/injury system — downed characters bleed out unless rescued
- Death is permanent (Kenshi-style brutality)

### Economy
- Gather resources (ore, wood, food, herbs)
- Craft gear and supplies
- Trade with wandering merchants or faction towns

### Factions
- **Iron Order** — militaristic knights, control Greenfields towns
- **Bog Witches** — swamp-dwelling mystics, hostile but recruitable
- **Ashen Horde** — raiders from the Ashlands, always hostile
- **Free Folk** — neutral traders and wanderers
- **The Hollow** — undead/cursed zone enemies, cannot be reasoned with

## Controls
- **Desktop**: WASD/arrow to pan camera, mouse click to select/command, number keys for squads, B for build menu, I for inventory, Tab to cycle characters
- **Mobile**: Touch-drag to pan, tap to select, long-press for context menu, buttons for build/inventory/cycle

## Visual Entities — Complete Sprite List

All sprites are 24x32 Pixel style unless noted.

### Player Characters (24x32, animated: idle 2-frame, walk 4-frame, attack 2-frame)
1. **Knight** — Steel helmet w/ red plume, blue tabard, chainmail, sword+shield (from Castle Run)
2. **Ranger** — Green hooded cloak, brown leather, longbow, quiver on back
3. **Miner** — Brown cap, grey smock, pickaxe over shoulder, lantern at belt
4. **Farmer** — Straw hat, green tunic, pitchfork/hoe
5. **Healer** — White robe with red cross, herb pouch, staff with crystal
6. **Blacksmith** — Bald/bandana, leather apron, hammer, muscular arms
7. **Scout** — Dark cloak, hood up, dual daggers, slim build
8. **Witch** — Purple robes, pointed hat, gnarled staff, glowing eyes

### Enemies (24x32, animated: idle 2-frame, walk 2-frame, attack 2-frame)
9. **Bandit** — Ragged clothes, scar, crude sword, patchwork armour
10. **Wolf** — Grey fur, yellow eyes, snarling (20x16, low profile)
11. **Skeleton** — Bone-white, rusted sword, tattered cloth remnants
12. **Bog Crawler** — Green-brown amphibian humanoid, webbed claws
13. **Ashen Raider** — Black/red armour, horned helmet, greatsword
14. **Hollow Wraith** — Translucent blue-white, floating, no legs, reaching hands

### NPCs (24x32, idle only)
15. **Merchant** — Rotund, brown cloak, backpack overflowing with goods
16. **Town Guard** — Iron helm, spear, shield with Iron Order crest
17. **Elder** — Long white beard, brown robes, walking stick

### Structures (various sizes, static)
18. **Campfire** — 16x16, stone ring, flames, warm glow
19. **Storage Chest** — 16x12, wooden, iron bands
20. **Wooden Wall** — 32x32, vertical logs, lashed together
21. **Gate** — 32x32, double wooden doors, iron hinges
22. **Workbench** — 24x16, wooden table with tools
23. **Forge** — 24x24, stone base, anvil, glowing coals
24. **Farm Plot** — 32x16, tilled earth rows, green sprouts
25. **Watchtower** — 24x48, wooden platform on stilts, ladder
26. **Bed** — 16x24, straw mattress, blanket

### Resources & Items (16x16, static)
27. **Ore Node** — Grey/brown rock with glinting metal veins
28. **Tree** — 24x32, trunk + canopy (choppable)
29. **Berry Bush** — 16x16, green with red dots
30. **Herb Patch** — 16x16, green leaves with purple flowers

### Terrain Tiles (16x16)
31. **Grass** — Green, slight variation
32. **Dirt Path** — Brown, worn
33. **Stone Floor** — Grey, for base interiors
34. **Water** — Blue, animated shimmer
35. **Swamp** — Dark green-brown, murky
36. **Snow** — White with blue shadows
37. **Ash** — Dark grey, embers

### UI Elements (various)
38. **Health bar** — Red/green gradient
39. **Skill icons** — 12x12 each (sword, bow, shield, pickaxe, etc.)
40. **Minimap frame** — Corner overlay
41. **Selection circle** — Green ring under selected character

## Colour Palettes (per character, 4-tone hue-shifted)

### Knight: Steel Blue
- Dark: #2a3a5a, Mid: #4a6a9a, Light: #7a9aca, Highlight: #aaccff
- Accent (tabard): #1a44aa → #4488dd

### Ranger: Forest Green
- Dark: #1a3a1a, Mid: #2a6a2a, Light: #4a9a4a, Highlight: #7acc7a
- Accent (cloak): #2a5a2a → #5aaa5a

### Miner: Earth Brown
- Dark: #3a2a1a, Mid: #6a4a2a, Light: #9a7a4a, Highlight: #ccaa7a

### Farmer: Warm Green
- Dark: #2a3a1a, Mid: #5a7a3a, Light: #8aaa5a, Highlight: #bbcc8a

### Healer: Holy White
- Dark: #8a8a9a, Mid: #aaaabc, Light: #ccccdd, Highlight: #eeeeff
- Accent (cross): #aa2222 → #dd4444

### Blacksmith: Forge Orange
- Dark: #3a2a1a, Mid: #7a4a2a, Light: #aa6a3a, Highlight: #dd9a5a

### Scout: Shadow Grey
- Dark: #1a1a2a, Mid: #3a3a4a, Light: #5a5a6a, Highlight: #8a8a9a

### Witch: Mystic Purple
- Dark: #2a1a3a, Mid: #5a3a7a, Light: #7a5aaa, Highlight: #aa8add
