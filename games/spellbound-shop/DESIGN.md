# Spellbound — Game Design Document

*A magical shopkeeping sandbox where every role is optional*

---

## Core Philosophy

1. **Total freedom** — You can farm, mine, craft, sell, explore, fight, or delegate any of these
2. **No arbitrary gates** — Difficulty is the only barrier. Deep mines have harder enemies, not locked doors
3. **Your pace** — No timers, no loans, no countdowns. Open shop when you want, explore when you want
4. **Magic is the system** — Not a class you pick. Magic is your tools, your crafting, your world interaction
5. **Depth through items** — Hundreds of items, multiple crafting paths, experimentation rewarded

---

## World Structure

### Your Property (Hub)
- **Shop floor** — Shelves, tables, display cases. Place items for sale. Customers walk in
- **Workshop** — Crafting stations: forge, alchemy table, enchanting altar, loom
- **Garden** — Plots for magical plants. Expandable. Different soil types
- **Your land** — Dig anywhere on your property to start mining. Your mine, your design
- **Living quarters** — Bed (save/advance time), storage chests, bookshelf (recipes)

### The Underground (Player-Created)
There is no pre-built mine. You pick a spot and dig. What you find depends on WHERE you dig and HOW DEEP you go. Your mine is YOUR mine — shaped by your choices, like Terraria.

The underground is procedurally generated tile-by-tile as you dig. Biomes transition with depth:
- **Topsoil** (0-30 blocks) — Clay, stones, worms, roots. Easy digging
- **Stone Layer** (30-80) — Copper, tin, iron veins. Rats, bats, slimes
- **Crystal Caverns** (80-150) — Open caves with crystal formations. Silver. Crystal golems, cave spiders
- **Fungal Forest** (150-220) — Bio-luminescent underground forest. Rare mushrooms. Spore beasts
- **Lava Tubes** (220-300) — Gold, obsidian, fire crystals. Magma slimes, fire elementals
- **Ice Depths** (300-380) — Mithril, frost crystals, frozen fossils. Ice wraiths
- **Shadow Caverns** (380-460) — Shadow ore, void crystals. Shadow beasts, mimics
- **The Abyss** (460+) — Starstone, ancient artifacts. Eldritch creatures

No depth is locked. You can dig straight down on day one. The rock gets harder, the enemies get nastier, and the air gets thinner. Better pickaxes, better magic, better preparation lets you survive deeper. But nothing stops you from trying.

You can build supports, place torches, install ladders, create minecart tracks. Your mine is infrastructure you invest in over time.

### The Wilderness (Above)
Overworld regions accessible from your shop:
- **Whispering Woods** — Common herbs, wood, small creatures
- **Marshlands** — Rare aquatic plants, bog iron, swamp creatures
- **Highland Meadows** — Flowers, honey, wind-aligned materials
- **Scorched Wastes** — Fire herbs, volcanic glass, salamanders
- **Frozen Peaks** — Ice flowers, sky crystals, mountain creatures
- **The Old Ruins** — Artifact fragments, spell tomes, undead

### Settlements
- **Millhaven** (nearby town) — Basic traders, hire common workers, sell surplus
- **Ironhold** (mining town) — Ore traders, hire miners, mining guild quests
- **Thornwick** (mage town) — Spell tomes, enchanting materials, hire mage adventurers

---

## Item System

### Material Categories

**Ores** (from mining)
| Tier | Ore | Found | Properties |
|------|-----|-------|------------|
| 1 | Copper | Floors 1-5 | Conducts magic weakly |
| 1 | Tin | Floors 1-5 | Alloys with copper |
| 2 | Iron | Floors 3-8 | Strong, versatile |
| 3 | Silver | Floors 8-15 | Anti-undead, conducts magic |
| 4 | Gold | Floors 15-25 | Enchantment amplifier |
| 5 | Mithril | Floors 25-35 | Lightweight, magic-resonant |
| 6 | Obsidian | Floors 20-30 | Sharp, fire-aligned |
| 7 | Starstone | Floors 40+ | Mythic properties |

**Crystals** (from mining, crystal caverns)
| Crystal | Element | Effect when crafted |
|---------|---------|-------------------|
| Ember Crystal | Fire | Adds fire damage/resistance |
| Frost Crystal | Ice | Adds ice damage/slow |
| Storm Crystal | Lightning | Adds shock/speed |
| Earth Crystal | Earth | Adds defense/weight |
| Light Crystal | Light | Adds healing/reveal |
| Shadow Crystal | Dark | Adds stealth/lifesteal |
| Void Crystal | Void | Adds chaos effects |
| Moon Crystal | Lunar | Changes with moon phase |

**Plants** (from farming)
| Plant | Season | Use |
|-------|--------|-----|
| Fireblossom | Summer | Fire potions, fire enchants |
| Moonpetal | Night bloom | Lunar potions, enchant catalyst |
| Thornroot | Spring | Poison, defense potions |
| Sunleaf | Summer | Healing, light potions |
| Frostmint | Winter | Ice potions, preservation |
| Shadow Vine | Autumn | Stealth potions, dark enchants |
| Starbloom | Rare/any | Legendary ingredient |
| Wheatgrass | Any | Basic potions, food |
| Crystal Moss | Cave garden | Crystal enhancement |
| Singing Reed | Near water | Sound/charm effects |
| Blood Orchid | Autumn | Powerful healing |
| Ghostcap Mushroom | Dark/damp | Spirit potions |
| Dragon Pepper | Summer/hot | Fire resistance, explosive |
| Dreamwillow Bark | Spring | Sleep, vision potions |
| Ironwood Sapling | Any (slow) | Durable crafting wood |

**Monster Drops** (from adventurers, combat)
- Slime gel, bat wings, spider silk, crystal shards
- Golem cores, elemental essences, dragon scales
- Shadow essence, void fragments, ancient bones
- Boss drops: unique crafting components

**Artifacts** (rare finds in ruins, deep mines)
- Spell tomes (learn new recipes)
- Ancient runes (enchanting components)
- Relic fragments (combine for powerful items)
- Blueprints (unlock advanced crafting stations)

### Crafting System

**Principle: experimentation over recipes**

The player discovers recipes by trying combinations. Some hints from:
- Tomes found in mines
- Customer requests ("I need something that burns AND heals")
- Adventurer reports ("I saw a creature immune to fire but weak to ice")
- Experimentation — just try putting things together

**Crafting Stations:**
1. **Forge** — Metals → weapons, armour, tools
2. **Alchemy Table** — Plants + liquids → potions, elixirs
3. **Enchanting Altar** — Item + crystal/essence → enchanted item
4. **Loom** — Fibres + materials → robes, cloaks, bags
5. **Workbench** — Wood + misc → furniture, shop items, basic tools
6. **Jeweller's Bench** — Gems + metals → rings, amulets, accessories
7. **Scribe's Desk** — Paper + essences → scrolls, spell books

**Crafting Examples (small sample of hundreds):**

```
Copper Bar + Copper Bar → Copper Sword (basic, 5 damage)
Iron Bar + Iron Bar → Iron Sword (10 damage)
Iron Sword + Ember Crystal → Flame Sword (10 damage + fire)
Flame Sword + Shadow Essence → Dark Flame Sword (15 + fire + lifesteal)
Dark Flame Sword + Starstone → Voidfire Blade (legendary)

Sunleaf + Water → Minor Healing Potion
Sunleaf + Blood Orchid + Water → Greater Healing Potion
Greater Healing Potion + Moon Crystal → Moonblessed Elixir (heals + buffs)

Iron Bar + Leather → Iron Chestplate
Iron Chestplate + Earth Crystal → Earthguard Plate (defense + knockback resist)
Earthguard Plate + Dragon Scale → Dragonhide Armour (legendary)

Silver Bar + Light Crystal → Holy Pendant (undead protection)
Gold Bar + Moon Crystal + Shadow Crystal → Twilight Amulet (day/night powers)
```

**Item Properties:**
Every item can have:
- Base stats (damage, defense, speed, etc.)
- Elemental alignment (fire, ice, etc.)
- Special effects (lifesteal, speed boost, reveal hidden, etc.)
- Durability (items wear out, can be repaired)
- Quality (depends on your skill + materials)
- Rarity tier: Common → Uncommon → Rare → Epic → Legendary → Mythic

---

## The Exchange — No Currency

There is no gold. No coins. No price tags. The economy runs on DIRECTION — every exchange either accumulates (inverted) or shares (generative). What you do with what you have IS the economy.

### Sharing (Generative)
- Offer an item to someone who needs it → generative
- Provide tools that serve a generative purpose → generative
- Connect a volunteer with naturally available resources (fallen branches the tree shed, crystals the cave grew) → generative
- Leave surplus on a table for the community → generative
- Teach a recipe to an apprentice → generative

Sharing generates abundance. The more you give genuinely, the more the world gives back — not as reward, but as the natural consequence of generative reality. Community grows. Helpers appear. Resources flow toward you because you flow them outward.

### Accumulation (Inverted)
- Selling a destructive tool → accumulative
- Hoarding materials beyond what you need → accumulative
- Trading only when the exchange favours you → accumulative
- Taking from the land without regard for what replenishes → accumulative
- Keeping knowledge secret for competitive advantage → accumulative

Accumulation generates scarcity. The more you take, the less the world offers freely. Community thins. Helpers stop coming. You must use force or cunning to acquire what would have come naturally.

### Your Place of Exchange
Not a "shop" in a good world. More like a community space:
- **Good-aligned:** People come and take what they need. They leave what they have excess of. Exchange is organic. You provide because providing is generative. The "shop" is a gathering place.
- **Neutral:** Some barter, some gifting, some taking. Traditional trade exists but isn't the only mode.
- **Evil-aligned:** A shop in the traditional sense. Everything has a cost. You extract maximum value. Customers are resources to exploit. Mercenaries work for payment in materials or power.

### The Feedback Loop
- Sharing → world improves → community grows → helpers bring materials → abundance → more to share
- Accumulation → world declines → community thins → must take by force → scarcity → need to accumulate more

Neither loop is stable. Abundance invites deception (someone will try to exploit your generosity). Scarcity invites desperation (eventually you have nothing left to take). The player navigates between.

### Visitors
| In Good World | In Evil World |
|---------------|---------------|
| Neighbours bringing surplus harvests | Desperate scavengers begging for scraps |
| Volunteers offering help with tasks | Mercenaries demanding payment in materials |
| Travelling scholars sharing knowledge | Rival powers sizing up your defences |
| Nature spirits leaving rare seeds | Corrupted creatures guarding resource nodes |
| Children bringing flowers | Thieves casing your stores |
| Angelic beings with gifts | Demonic beings with "bargains" |

---

## Adventurer System

### Volunteers and Mercenaries
In a good world, adventurers VOLUNTEER — drawn by your generative presence. In an evil world, you HIRE mercenaries with materials and power. In neutral: a mix of both. Each has:
- **Name** and appearance (procedurally generated)
- **Type**: Warrior, Scout, Mage, Ranger
- **Stats**: Strength, Speed, Magic, Endurance, Luck
- **Personality trait** (one primary):
  - **Bold** — pushes deeper, higher risk/reward
  - **Careful** — always returns, less loot
  - **Greedy** — keeps some finds for themselves
  - **Loyal** — gives everything, stays with you long-term
  - **Curious** — finds unusual items, sometimes gets lost
- **Gear slots**: Weapon, Armour, Accessory, Consumables (3 slots)

### Sending on Expeditions
1. Equip them with your crafted gear
2. Choose a destination (mine floor range, wilderness region, ruins)
3. They leave for 1-3 days
4. They return with:
   - Materials (quality based on gear + skill + destination)
   - Discoveries (new areas, enemy info, recipe hints)
   - Sometimes injuries (need healing potions)
   - Sometimes lost gear (died, revived at nearest town, lost equipment)
   - Stories (flavour text, world-building)

### Adventurer Progression
- Gain experience from expeditions
- Level up stats gradually
- Unlock ability to explore harder regions
- Better gear = dramatically better results
- A well-equipped high-level adventurer can bring back legendary materials

### YOU as Adventurer
You can go yourself. Same regions, same dangers, but:
- You control the action directly (real-time combat)
- You can use magic spells (adventurers can't)
- You can mine specific veins (adventurers bring random materials)
- You choose when to retreat
- Risk: you can die (respawn at shop, lose carried inventory, keep equipped gear)

---

## Delegation Summary

| Role | You Do It | Hire Someone |
|------|-----------|-------------|
| Farm | Plant, water, harvest | Volunteers / nature spirits tend it |
| Mine | Explore, dig, shape | Volunteers explore / mercenaries extract |
| Craft | Experiment, discover recipes | Apprentices learn from you, create basic items |
| Exchange | Offer, share, provide | Community self-organises / hired merchants exploit |
| Explore | Direct control, real-time | Volunteers scout / mercenaries raid |
| Supply | Gather everything yourself | Community brings surplus / you take by force |

In a good world, delegation happens organically — the world sends help. In an evil world, you must compel or pay for every hand. In neutral, you do most things yourself with occasional help.

---

## The Interference — World State System

The world exists as an interference pattern between generative reality and inverted reality. Both are always present. The player's choices shift the local balance, changing everything — visuals, danger, opportunity, and the nature of threats.

### The Spectrum

The world state is a value from -100 (deeply inverted/evil) to +100 (deeply generative/good). It starts near 0 (neutral). Every meaningful choice nudges it.

**There is no stable endpoint.** A fully good world intensifies deception. A fully evil world makes your good acts devastatingly powerful. The game is navigating the tension, not solving it.

### What Shifts the World

Toward generative (+):
- Crafting with care (using quality materials, not cutting corners)
- Fair pricing in the shop
- Equipping adventurers well before sending them out
- Tending the garden (genuine cultivation)
- Helping NPCs without expecting reward
- Building and creating
- Using magic to grow, heal, illuminate

Toward inverted (-):
- Price gouging, exploiting desperate customers
- Sending adventurers with poor gear (treating them as disposable)
- Strip-mining without replanting
- Hoarding materials beyond what you need
- Deception in trading
- Using magic to destroy, corrupt, dominate
- Neglecting employees while profiting from their work

These aren't "good deeds" and "bad deeds" on a morality checklist. They reflect the DIRECTION of your will — are you generating genuinely, or directing your capacity toward accumulation for its own sake?

### Evil World (inverted aesthetic, state < -30)

**Visuals:** Palette shifts toward desaturated purples, sickly greens, dark reds. Sky is overcast or bruised. Plants look twisted. Buildings show decay. Light sources flicker.

**Gameplay effects:**
- Enemies are stronger, more numerous, more aggressive
- Mines are unstable, cave-ins more frequent
- Crops mutate — some become dangerous but yield rare ingredients
- Customers are desperate — willing to pay premium prices
- Rare/dark materials become MORE available (shadow crystals, void ore)
- Weather turns hostile (acid rain, darkness, storms)

**BUT: evil is wholly susceptible to good.**
- A healing potion in a corrupted world has 3x effect
- A well-crafted light enchantment clears corruption in a radius
- A genuinely generous act (fair price to a desperate customer) has outsized impact on world state
- Good items are DEVASTATING against corrupted enemies
- One genuine act can shift things dramatically because the inversion is built on nothing

**The worse it gets, the more powerful your genuine creation becomes.** This is the philosophical principle made mechanical: the contentless claim cannot resist what IS.

**How good affects evil beings:** Good doesn't "do damage" to evil. The PRESENCE of genuine good inverts the inversion — forces the corrupted being back toward its generative nature. This is suffering for an inverted being. A creature oriented toward the contentless direction experiences the return to genuine reality as agony. Evil beings don't fight good and lose — they encounter good and suffer the undoing of what they've made themselves. This means:
- Powerful good items don't need to BE weapons — their presence transforms
- Evil creatures may flee from genuine good rather than fight it
- A light enchantment in a dark cave doesn't "damage" shadow creatures — it forces them to confront what they've inverted from
- Healing magic doesn't do "holy damage" — its generative nature is structurally incompatible with inversion
- The player in an evil world is already changing it just by being there and acting genuinely

### Good World (generative aesthetic, state > +30)

**Visuals:** Warm golden light, lush vegetation, vibrant colours, clear skies. Buildings look well-maintained. Animals appear. Music shifts to major keys.

**Gameplay effects:**
- Garden thrives — faster growth, higher quality, rare seeds appear
- Mines are stable, veins are rich
- Town prospers — more customers, better stock from traders
- Adventurers are enthusiastic, find better loot
- Peaceful overworld — fewer threats, more foraging opportunities
- Employees work better, are more loyal

**BUT: attempted deception looms.**
- Travelling merchants appear offering "incredible" deals — some are cursed materials
- Charming NPCs arrive with requests that seem generous but subtly exploit you
- An adventurer who seems loyal is actually keeping the best finds
- A customer offers a huge sum for an item that, once sold, shifts the world negatively
- Rare "opportunities" appear that are too good to be true — and are
- The deception is SUBTLE — it never announces itself as evil

**The better things get, the harder it is to see the threat.** This is the philosophical principle: the inversion works through deception, presenting the contentless claim as genuine. In a good world, you can't tell the difference by looking.

### How Good and Evil Actually Interact

**Good is not directed at evil.** Good is directed at its own generative purpose. A gardener grows plants. A miner reveals stone. A crafter creates items. The evil in that domain inverts as a natural consequence of genuine willing — not because you aimed at it, but because genuine generation and inversion cannot coexist. You're never fighting evil. You're just genuinely doing your thing.

**Mindsets:** The player is always in a generative mindset based on their current activity. Each mindset radiates an aura that inverts the corresponding evil in that domain. Only one mindset at a time — evil in other domains persists until you go there and genuinely work in that domain.

| Mindset | Generative | Its Inversion (Evil) |
|---------|-----------|---------------------|
| Cultivation | Growing, fruiting, flowering | Wilting, withering, desiccating |
| Earthcraft | Revealing, crystallising, forming | Collapsing, depleting, entombing |
| Artifice | Creating, shaping, imbuing purpose | Corroding, corrupting, unmaking |
| Providence | Fair exchange, providing need | Exploiting, hoarding, defrauding |
| Wayfinding | Discovering, illuminating paths | Concealing, misleading, trapping |
| Restoration | Healing, mending, returning to wholeness | Sickening, poisoning, decaying |

**Evil can ONLY tempt within the active mindset.** A trader is tempted by exploitation, not by cave-ins. A gardener is tempted by a wilted plant that promises better yields, not by a cursed sword. Evil speaks your language. It offers what you already want, inverted.

**The temptation always trades breadth for narrowness.** Take the wilted plant that boosts YOUR section of the garden — and the broader garden withers. Find the rich vein that gives YOU double ore — and the surrounding tunnels collapse. Get the deal that makes YOU wealthy — and the supplier is ruined. Each acceptance narrows your generative scope. Eventually you're generating only for yourself, which IS the inversion complete: willing to BE Anything rather than willing FROM Anything.

**Evil cannot affect good unless good is deceived into believing it's affected.** Evil slithers around good — it cannot touch it directly. A genuinely generative player in a corrupted world is not harmed by evil creatures. The creatures circle, threaten, posture — but their attacks don't land. Evil can only damage you through DECEPTION: making you believe you've been hit, making you believe your gear is insufficient, making you believe you need corrupted power to survive. If you see through it, nothing happened.

This means:
- "Damage" from evil sources is accepted deception — your character believes the illusion
- High generative world state = you see through more deceptions = you take less "damage"
- The best defense isn't armour — it's genuine good. A player whose acts are generative is literally untouchable by evil
- Evil's REAL threat is never the monster — it's the whisper that says "take the cursed sword, it's stronger"
- A player using corrupted gear has ACCEPTED the deception — now evil can affect them, because they've invited the inversion into their reality
- This makes the choice of what to equip, what to sell, what to craft genuinely consequential — not as a morality system but as a reality system

### Enemies, Helpers, and Community

**Enemy frequency scales with evil.** The more inverted the world, the more hostile creatures exist. Not as punishment — as accumulated inversion manifesting. Evil pools and takes form. A deeply evil world is swarming with demons, corrupted beasts, and rival powers.

**Evil is competitive.** Evil beings fight each other. There is no evil community — only dominance hierarchies. An evil player is always defending their position against things trying to take it. More power attracts more challengers.

**Good attracts community.** The more generative the world, the more helpers appear. Nature spirits tend your crops. Earth elementals stabilise your tunnels. Loyal customers bring rare gifts. Angelic beings collect materials for you. You didn't summon them — they came because genuine generation attracts participation. Good players don't have to do everything alone. The world WANTS to help.

**The explorer's choice:** You find a shiny new pickaxe beside a rock face covered in growing crystals.
- **Take the pickaxe, smash the rock:** You've chosen destruction over cultivation within Earthcraft. Inside the rock might be a demonic something — accumulated inversion released by the destructive act. You get materials, but you've invited evil into this space.
- **Ignore the pickaxe, tend the crystals:** You've stayed generative. An angelic something arrives and collects crystals for you — community drawn to genuine willing. No combat. No temptation accepted. Just generation attracting generation.

The pickaxe isn't evil. It's a tool. But it reframes Earthcraft from "revealing" to "breaking open." The CHOICE of how to use it is where the inversion enters or doesn't.

**In practice:**
- Evil world: constant combat, hostile creatures, rival powers, rich spoils, no allies
- Neutral world: mixed encounters, some enemies, some helpers, temptations and opportunities
- Good world: rare enemies, many helpers, community support, subtle deceptions disguised as allies

**The deception in good worlds:** Some "helpers" in a deeply good world are deceptions. The nature spirit that offers to tend your garden but subtly corrupts the soil. The generous customer who's actually casing your shop. Good must remain vigilant — but the vigilance is about discernment, not combat.

### The Neutral Zone (-30 to +30)

Most gameplay occurs here. The world looks ordinary — some beauty, some decay. Both generative and inverted elements are present without dominating. The player is still making choices that push in either direction, but the effects are gradual and the world feels balanced.

### Key Design Rules

1. **The player is never told the world state number.** They feel it through aesthetics, NPC behaviour, and gameplay changes. No morality meter on screen.
2. **No choice is labelled good or evil.** The player discovers through consequences.
3. **Reversal is always possible.** Even at -100, one genuine act starts shifting back. Even at +100, one deception starts corroding.
4. **The world doesn't judge.** It reflects. Your reality is the interference of your choices with the generative ground.
5. **An evil playthrough is viable.** Dangerous but rich in rare materials. Some players will prefer it. That's freedom.
6. **A good playthrough is viable.** Safe but demanding vigilance against deception. Some players will prefer it. That's also freedom.

---

## Magic System

Magic isn't a class. It's tools you learn and use everywhere. Magic is tapping into the generative layer — it works WITH reality's creative capacity:

| Spell | Source | Use |
|-------|--------|-----|
| Stone Shape | Earth Tome (mine) | Clear rock, create walls, mine faster |
| Magelight | Light Crystal study | Illuminate dark areas, reveal hidden veins |
| Flame Touch | Ember Crystal study | Smelt ore without forge, light fires |
| Frost Ward | Frost Crystal study | Preserve food/potions, create ice bridges |
| Growth | Sunleaf research | Speed plant growth, improve crop quality |
| Purify | Light Tome (ruins) | Remove corruption, purify water |
| Shadow Step | Shadow Crystal study | Stealth, avoid enemies |
| Enchant | Enchanting altar mastery | Imbue items with magical properties |
| Far Sight | Storm Crystal study | See distant areas, check on adventurers |
| Mend | Basic tome | Repair equipment durability |

Spells cost mana (regenerates over time, boosted by crystals and potions).

---

## Progression — What You Use Levels Up

No XP bar. No level-up screen. No skill points to allocate. Your abilities improve through practice — you actualise through expression.

| Activity | What Improves | How |
|----------|--------------|-----|
| Mining | Swing speed, ore yield, stamina | Each block broken adds fractional skill |
| Farming | Growth speed, crop quality, harvest yield | Each plant tended adds skill |
| Crafting | Item quality, recipe intuition, material efficiency | Each item crafted adds skill |
| Combat | Damage, dodge timing, stamina | Each fight adds skill |
| Magic | Spell power, mana pool, cast speed | Each spell cast adds skill |
| Trading | Better prices, customer satisfaction, haggle success | Each sale adds skill |
| Exploring | Movement speed, trap detection, map reveal range | Distance travelled adds skill |

**Rules:**
- Skills increase slowly and invisibly — no numbers shown to the player
- You FEEL the improvement: mining feels faster, crops grow better, potions are stronger
- Skills plateau at each tier — to break through, you need better tools/materials (not just more grinding)
- If you don't do something for a long time, skill doesn't decrease — but the world's demands increase, so relative ability matters
- Hired employees improve the same way — a farmhand who works for 30 days is better than a new one
- Adventurers gain experience from expeditions, making them more effective over time

This means: a player who mines constantly becomes a master miner. A player who never mines but hires miners doesn't develop that skill — but their miners do. Every playstyle develops its own competencies.

---

## Day/Night & Seasons

**Day Phases:**
- Dawn — garden grows, morning customers arrive
- Day — prime shop hours, mining, exploring
- Dusk — adventurers return, evening traders
- Night — some plants bloom, dangerous to explore, good for starstone

**Seasons** (each = ~7 in-game days):
- Spring — most plants grow, rain common
- Summer — fire plants bloom, longer days
- Autumn — harvest season, shadow materials stronger
- Winter — ice materials abundant, some plants dormant

Player controls time advancement — rest to skip forward, or play in real-time.

---

## Pixel Art Style

**Resolution:** 16x16 tiles, 32x32 characters
**Palette:** Warm, slightly desaturated (like Stardew Valley)
**Style:** Clear silhouettes, minimal detail that suggests more than it shows
**View:** Top-down for shop/garden/overworld, side-view for mines (like Terraria)

All sprites procedurally generated using the pixel engine. Each item has a distinct icon. Characters are recognisable by silhouette. The world should feel cozy above ground and dangerous below.

---

## Technical Plan (Browser Game)

### Architecture
- Multi-file: HTML + CSS + JS modules
- Canvas rendering, 60fps
- localStorage save system (auto-save)
- Tile-based world
- State machine for game modes (shop, garden, mine, explore, craft)

### Build Phases

**Phase 1 — Core Loop (MVP)**
- Shop: place items, customers buy, basic pricing
- Garden: 8 plant types, planting, watering, harvesting
- Mine: 10 floors, 4 ore types, 3 crystal types, basic enemies
- Crafting: 50 recipes across forge + alchemy
- 3 adventurer types, basic expedition system
- Day/night cycle
- 30-40 unique items
- Save/load

**Phase 2 — Depth**
- 150+ recipes, enchanting system
- 25 mine floors, 3 biomes
- Wilderness exploration (2 regions)
- Employee delegation (farmhand, shopkeeper)
- 8 adventurer personalities
- Furniture/shop decoration
- 100+ unique items

**Phase 3 — Full Vision**
- 300+ recipes, legendary items
- 40+ mine floors, all biomes
- Full wilderness (6 regions)
- All delegation roles
- Towns and trading
- Boss encounters
- Moon phases, weather
- 500+ unique items

---

## Name Ideas

- **Spellbound** — your shop, your spells, your world
- **Arcanum & Co.** — sounds like a shop name
- **The Enchanted Anvil**
- **Grimoire & Grind** — playful
- **Hearthstone** (taken)
- **Ember & Ash**
- **The Last Artificer**
- **Runeshop**

---

## Resolved Decisions

- **Mine**: Player-created, Terraria-style. Dig where you want, shape your own underground
- **Progression**: What you use levels up. No XP bars, no skill menus. Felt, not shown
- **World state**: Interference pattern. Choices shift aesthetic and gameplay between generative and inverted. No morality meter — player feels it
- **Evil world**: Dangerous but susceptible to good. Good acts are devastating
- **Good world**: Thriving but deception looms. Threats are subtle, not obvious
- **Pixel style**: 16x16 tiles, 32x32 characters. Stardew Valley feel. Silhouettes suggest more than they show

## Open Questions

1. ~~Combat style when player explores~~ — RESOLVED: two systems depending on alignment. Evil path = conventional action combat (power vs power). Good path = recognition puzzle (identify what the evil inverts, will the exact corresponding good). Defending/blocking is believing the evil's premise. Mixed alignment = both systems partially active.
2. Multiplayer potential? (shared world, trading between players)
3. Relationship system: include as optional, or skip entirely?
4. Name — none of the current suggestions feel right
5. How does the world state affect the MUSIC? (this could be the most powerful expression of the interference pattern)
6. Should the player be able to see other players' worlds / trade between them?
