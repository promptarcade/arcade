# Elemental — Design Document

## Concept
A combination/alchemy game. Start with 4 base elements (Water, Fire, Earth, Air). Combine any two elements to discover new ones. The goal is to discover all elements. Inspired by Little Alchemy but with an original element tree, visual identity, and UI.

## Core Mechanics
- **Workspace**: A central area where elements can be dragged/tapped
- **Combine**: Select two elements to combine them. If a valid recipe exists, a new element is discovered
- **Discovery**: Newly discovered elements are added to the sidebar/palette with a satisfying reveal animation
- **No fail state**: Wrong combinations simply do nothing (brief shake feedback)
- **Progress**: Discovery counter shows X / total discovered
- **Hints**: After 30 seconds without a discovery, a subtle glow appears on elements that still have undiscovered combinations
- **Save**: Auto-saves discovered elements to localStorage

## Controls
- **Desktop**: Click an element in the palette to select it (highlighted), click a second to combine. Or drag two elements onto the workspace.
- **Mobile**: Tap to select first element, tap second to combine. Simple two-tap flow.
- **Reset**: Button to clear progress and start over (with confirmation)

## Element Tree (120 elements across 10 tiers)

### Tier 0 — Base (4)
Water, Fire, Earth, Air

### Tier 1 — Basic (8)
- Water + Fire = Steam
- Water + Earth = Mud
- Water + Air = Rain
- Fire + Earth = Lava
- Fire + Air = Smoke
- Earth + Air = Dust
- Water + Water = Lake
- Fire + Fire = Energy

### Tier 2 — Natural (12)
- Lava + Water = Stone
- Lava + Air = Ash
- Steam + Air = Cloud
- Rain + Earth = Plant
- Mud + Fire = Brick
- Stone + Fire = Metal
- Lake + Air = Mist
- Dust + Water = Clay
- Energy + Air = Lightning
- Cloud + Water = Storm
- Smoke + Water = Fog
- Rain + Rain = Flood

### Tier 3 — Materials & Life (16)
- Plant + Fire = Coal
- Plant + Water = Algae
- Plant + Earth = Tree
- Plant + Plant = Garden
- Metal + Fire = Blade
- Metal + Water = Rust
- Clay + Fire = Pottery
- Brick + Brick = Wall
- Stone + Stone = Mountain
- Cloud + Cloud = Sky
- Lightning + Metal = Magnet
- Storm + Lake = Wave
- Algae + Lake = Swamp
- Tree + Tree = Forest
- Ash + Water = Soap
- Coal + Fire = Diamond

### Tier 4 — Structures & Nature (16)
- Wall + Wall = House
- Blade + Wood (Tree+Blade) = Axe...

Actually, let me simplify the tree. Here are the recipes:

### Complete Recipe List (120 discoveries)

**Tier 1 (from base combos):**
Water+Fire=Steam, Water+Earth=Mud, Water+Air=Rain, Fire+Earth=Lava, Fire+Air=Smoke, Earth+Air=Dust, Water+Water=Lake, Fire+Fire=Energy

**Tier 2:**
Lava+Water=Stone, Lava+Air=Ash, Steam+Air=Cloud, Rain+Earth=Plant, Mud+Fire=Brick, Stone+Fire=Metal, Lake+Air=Mist, Dust+Water=Clay, Energy+Air=Lightning, Cloud+Water=Storm, Smoke+Water=Fog, Earth+Earth=Mountain

**Tier 3:**
Plant+Fire=Coal, Plant+Water=Algae, Plant+Earth=Tree, Plant+Plant=Garden, Metal+Fire=Blade, Clay+Fire=Pottery, Brick+Brick=Wall, Stone+Stone=Boulder, Lightning+Metal=Magnet, Storm+Lake=Wave, Algae+Lake=Swamp, Tree+Tree=Forest, Coal+Fire=Diamond, Mountain+Plant=Vine, Cloud+Cloud=Sky, Ash+Water=Soap

**Tier 4:**
Wall+Wall=House, Tree+Blade=Wood, Tree+Fire=Charcoal, Forest+Fire=Wildfire, Garden+Water=Flower, Wave+Wave=Ocean, Swamp+Plant=Moss, Metal+Metal=Alloy, Pottery+Water=Vase, Diamond+Metal=Ring, Sky+Fire=Sun, Sky+Water=Snow, Mountain+Cloud=Glacier, Mud+Plant=Mushroom, Boulder+Water=River, Fog+Forest=Mystery

**Tier 5:**
Sun+Water=Rainbow, Sun+Plant=Fruit, Sun+Earth=Desert, Snow+Earth=Tundra, Ocean+Earth=Island, Ocean+Wind(Air)=Sail, Wood+Water=Boat, House+House=Village, River+Stone=Waterfall, Flower+Flower=Bouquet, Wildfire+Rain=Renewal, Alloy+Fire=Steel, Ring+Flower=Love, Mushroom+Earth=Mycelium, Glacier+Sun=Iceberg, Mystery+Fire=Phoenix

**Tier 6:**
Village+Village=Town, Boat+Sail=Ship, Steel+Blade=Sword, Desert+Water=Oasis, Island+Plant=Palm, Fruit+Water=Juice, Love+House=Home, Rainbow+Stone=Crystal, Waterfall+Energy=Hydropower, Phoenix+Ash=Rebirth, Tundra+Plant=Lichen, Bouquet+Vase=Decoration, Iceberg+Ocean=Arctic, Mycelium+Rain=Truffle, Renewal+Earth=Fertile, Ship+Storm=Shipwreck

**Tier 7:**
Town+Town=City, Sword+Fire=Flaming Sword, Home+Garden=Estate, Crystal+Light(Sun)=Prism, Oasis+Palm=Paradise, Hydropower+Town=Electric City, Arctic+Fire=Aurora, Shipwreck+Ocean=Treasure, Fertile+Plant=Harvest, Truffle+Fire=Delicacy, Lichen+Stone=Fossil, Decoration+Home=Cozy, Juice+Fire=Wine, Prism+Rain=Spectrum, Ship+Ocean=Voyage, Rebirth+Plant=Sprout

**Tier 8:**
City+Garden=Park, Estate+Flower=Manor, Paradise+Love=Utopia, Treasure+Ship=Pirate, Aurora+Sky=Northern Lights, Harvest+Village=Festival, Flaming Sword+Dragon(Lava+Air)=Legend, Wine+Pottery=Cellar, Fossil+Rain=Oil, Cozy+Fire=Hearth, Electric City+Steel=Metropolis, Voyage+Island=Explorer, Delicacy+Home=Feast, Sprout+Sun=Sapling, Spectrum+Crystal=Gem, Park+Fountain(Water+Stone)=Serenity

## Visual Entities

This is a text/icon-based UI game — no pixel art sprites needed. Each element gets:

### Element Icons
- Each element displayed as a colored circle/rounded-rect tile with a 1-2 character symbol or small canvas-drawn icon
- Color palette per element category:
  - Base: Water=#4488cc, Fire=#dd4422, Earth=#886633, Air=#aabbcc
  - Natural: greens, browns
  - Materials: grays, metallics
  - Life: bright greens, yellows
  - Structures: warm browns, reds
  - Cosmic: purples, golds
- Size: 48x48px tiles in palette, 64x64px when selected/combining

### Workspace
- Central dark area (~70% of screen width)
- Subtle particle effect — tiny floating motes matching the last discovered element's color

### Discovery Animation
- New element bursts from center with expanding ring
- Element tile scales up from 0 with elastic easing
- Brief glow pulse
- Counter increments with satisfying tick

### UI Layout
- **Top**: Title "Elemental" + discovery counter "42 / 120"
- **Left/Bottom sidebar**: Scrollable palette of discovered elements, organized by tier
- **Center**: Workspace showing selected elements and combination result
- **Bottom bar**: Reset button, hint toggle

### Color Scheme
- Background: deep charcoal #1a1a2e
- Panels: #16213e with subtle borders
- Text: #e0d6c8 warm white
- Accents: element-specific colors

## Mobile Layout
- Palette moves to bottom of screen as horizontal scrollable strip
- Workspace takes full width above
- Two-tap combine: tap first element (it highlights and moves to "slot 1"), tap second (moves to "slot 2"), combination animates automatically

## Sound
- Soft chime on successful discovery (pitch varies by tier)
- Low thud on failed combination
- Ambient low hum (optional, off by default)
