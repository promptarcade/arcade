
// ============================================================
// STATE: Help — multi-page guide to all game systems
// ============================================================
var HelpState = {
  name: 'help',
  drawBelow: true,
  _page: 0,
  _pages: [
    {
      title: 'THE VOID',
      lines: [
        { text: 'THE WORLD IS DYING', color: '#aa44ff', bold: true },
        { text: 'Dark corruption seeps from the dungeon entrances.', color: '#ccc' },
        { text: 'It spreads across the land, killing crops and', color: '#ccc' },
        { text: 'driving away life. Left unchecked, it consumes all.', color: '#ccc' },
        { text: '' },
        { text: 'CLEAR THE DUNGEONS', color: '#dd6644', bold: true },
        { text: 'Kill the boss on the deepest floor to destroy', color: '#ccc' },
        { text: 'the dungeon heart. This stops corruption spreading', color: '#aaa' },
        { text: 'from that entrance and the land slowly heals.', color: '#aaa' },
        { text: '' },
        { text: 'BUILD THE OBELISK', color: '#ffcc44', bold: true },
        { text: 'A purifying monument powered by dungeon hearts.', color: '#ccc' },
        { text: '5 tiers, each requiring rarer materials:', color: '#aaa' },
        { text: 'Stone, iron, gold, gems, crystals, enchanted gear.', color: '#aaa' },
        { text: 'Each tier pushes corruption back further.', color: '#aaa' },
        { text: 'Complete all 5 tiers to purify the world and WIN.', color: '#88ff88' },
        { text: '' },
        { text: 'THE WORLD REMEMBERS', color: '#8899cc', bold: true },
        { text: 'When you die, your village becomes ruins.', color: '#aaa' },
        { text: 'Your ghost NPCs remember. Your gear waits.', color: '#aaa' },
        { text: 'Each life builds on the last.', color: '#aaa' },
      ],
    },
    {
      title: 'CONTROLS',
      lines: [
        { text: 'MOVEMENT', color: '#ddaa44', bold: true },
        { text: 'WASD / Arrow keys to move', color: '#ccc' },
        { text: '' },
        { text: 'ACTIONS', color: '#ddaa44', bold: true },
        { text: '[E]  Pick up (standing on) or aim (trees/ore/NPCs)', color: '#ccc' },
        { text: '     Then press direction to chop/mine/talk', color: '#aaa' },
        { text: '[I]  Open inventory (bag, skills, equipment)', color: '#ccc' },
        { text: '[C]  Open crafting menu', color: '#ccc' },
        { text: '[B]  Open build menu', color: '#ccc' },
        { text: '[P]  Eat food or drink potion (heals HP)', color: '#ccc' },
        { text: '[H]  This help screen', color: '#ccc' },
        { text: '[M]  Mute sound', color: '#ccc' },
        { text: '[Tab]  Toggle minimap (in dungeons)', color: '#ccc' },
        { text: '' },
        { text: 'COMBAT (in dungeons)', color: '#ddaa44', bold: true },
        { text: '[1-4]  Use ability, then choose direction', color: '#ccc' },
        { text: '[Space]  Wait a turn', color: '#ccc' },
      ],
    },
    {
      title: 'GATHERING',
      lines: [
        { text: 'Stand next to a resource and press [E]', color: '#ccc' },
        { text: '' },
        { text: 'BARE HANDS (no tool needed)', color: '#ddaa44', bold: true },
        { text: 'Herbs, flowers, berries, mushrooms (Herbalism)', color: '#aaa' },
        { text: 'Rocks, insects, flint, worms (Gathering)', color: '#aaa' },
        { text: '' },
        { text: 'TOOLS REQUIRED', color: '#dd6644', bold: true },
        { text: 'Trees \u2192 [E] then press direction. Need Axe.', color: '#aaa' },
        { text: 'Ore veins \u2192 [E] then press direction. Need Pickaxe.', color: '#aaa' },
        { text: 'Fishing \u2192 Stand on shore, [E]. Need Rod.', color: '#aaa' },
        { text: '' },
        { text: 'Tools break after use! Check durability in top-right.', color: '#cc8844' },
        { text: 'Better tools: Iron Axe, Iron Pickaxe (need smelted bars)', color: '#aaa' },
        { text: '' },
        { text: 'GETTING STARTED', color: '#ddaa44', bold: true },
        { text: '1. Pick up rocks and catch insects [E] (bare hands)', color: '#aaa' },
        { text: '2. Craft a Stone Axe [C] (need branches, stone, flint)', color: '#aaa' },
        { text: '3. Chop trees for logs [E]', color: '#aaa' },
        { text: '4. Craft a Pickaxe and Fishing Rod [C]', color: '#aaa' },
      ],
    },
    {
      title: 'CRAFTING & BUILDING',
      lines: [
        { text: 'CRAFTING [C]', color: '#ddaa44', bold: true },
        { text: 'Turn raw resources into useful items.', color: '#ccc' },
        { text: 'Recipes unlock as your skills level up.', color: '#aaa' },
        { text: 'Up/Down to browse, Enter to craft.', color: '#aaa' },
        { text: '' },
        { text: 'BUILDING [B]', color: '#ddaa44', bold: true },
        { text: 'Place structures on the overworld.', color: '#ccc' },
        { text: 'Costs resources from your bag.', color: '#aaa' },
        { text: 'Left/Right to select, Enter to place.', color: '#aaa' },
        { text: '' },
        { text: 'STRUCTURES', color: '#ddaa44', bold: true },
        { text: 'Campfire — marks territory  |  Path/Road — connect areas', color: '#aaa' },
        { text: 'Small Home (1 NPC) / Large Home (2 NPCs)', color: '#aaa' },
        { text: 'Workshop — crafting  |  Farm Plot — grow crops', color: '#aaa' },
        { text: 'Food Store — stock food, attract skilled visitors', color: '#aaa' },
        { text: 'Craft Store — stock crafts, attract skilled crafters', color: '#aaa' },
        { text: 'Tavern — boosts morale  |  Stable — shelter mounts', color: '#aaa' },
        { text: 'Town Hall — centre of governance (expensive!)', color: '#aaa' },
        { text: 'Well, Fence, Lantern Post — decoration & utility', color: '#aaa' },
      ],
    },
    {
      title: 'VILLAGE & NPCs',
      lines: [
        { text: 'TALKING TO NPCS', color: '#ddaa44', bold: true },
        { text: 'Stand next to someone, press [E].', color: '#ccc' },
        { text: 'Travellers wander the world. Residents live in homes.', color: '#aaa' },
        { text: '' },
        { text: 'HIRING', color: '#ddaa44', bold: true },
        { text: 'Build a home, then talk to a traveller.', color: '#ccc' },
        { text: 'Press [Y] to invite them to live in your village.', color: '#aaa' },
        { text: 'They get a job matching their best skill.', color: '#aaa' },
        { text: 'Residents gather resources for you during the day.', color: '#aaa' },
        { text: '' },
        { text: 'RELATIONSHIPS', color: '#ddaa44', bold: true },
        { text: 'Residents who live and work near each other bond.', color: '#ccc' },
        { text: 'Strong bonds can lead to romance and children.', color: '#aaa' },
        { text: '' },
        { text: 'EXPEDITIONS', color: '#ddaa44', bold: true },
        { text: 'Residents with combat skill can explore ruins.', color: '#ccc' },
        { text: 'Talk to them and choose [X] Send on expedition.', color: '#aaa' },
        { text: 'They return with loot — or may not return at all.', color: '#aaa' },
      ],
    },
    {
      title: 'FARMING & FOOD',
      lines: [
        { text: 'FARMING', color: '#ddcc55', bold: true },
        { text: '1. Build a Farm Plot [B]', color: '#ccc' },
        { text: '2. Stand next to it, press [E]', color: '#ccc' },
        { text: '3. Choose a seed to plant', color: '#ccc' },
        { text: '4. Wait for it to grow (watch the progress bar)', color: '#ccc' },
        { text: '5. Press [E] when ready to harvest', color: '#ccc' },
        { text: '' },
        { text: 'Rain makes crops grow faster.', color: '#6688cc' },
        { text: 'Storms slow growth. Snow nearly stops it.', color: '#8866cc' },
        { text: '' },
        { text: 'SEEDS', color: '#ddaa44', bold: true },
        { text: 'You start with wheat and carrot seeds.', color: '#aaa' },
        { text: 'Craft more seeds from harvested crops [C].', color: '#aaa' },
        { text: 'Berry seeds come from wild berries.', color: '#aaa' },
        { text: '' },
        { text: 'FOOD & HEALING [P]', color: '#ddaa44', bold: true },
        { text: 'Press [P] to eat food or drink a potion.', color: '#ccc' },
        { text: 'Health Potion: 50% HP  |  Sushi: 30 HP', color: '#aaa' },
        { text: 'Fish Stew: 20 HP  |  Healing Salve: 15 HP', color: '#aaa' },
        { text: 'Dried Fish: 8 HP  |  Carrot: 5 HP  |  Berry: 3 HP', color: '#aaa' },
        { text: 'Higher recipes require crafting simpler ones first.', color: '#aaa' },
      ],
    },
    {
      title: 'ANIMALS & PETS',
      lines: [
        { text: 'WILDLIFE', color: '#ddaa44', bold: true },
        { text: 'Animals roam the overworld. They move 2 tiles per turn.', color: '#ccc' },
        { text: 'Rabbits, deer, foxes are peaceful (flee from you).', color: '#aaa' },
        { text: 'Wolves, boars, bears are hostile (attack on sight).', color: '#ff8888' },
        { text: '' },
        { text: 'TAMING', color: '#ddaa44', bold: true },
        { text: 'Stand next to an animal, press [E].', color: '#ccc' },
        { text: 'You need the right food to tame them:', color: '#aaa' },
        { text: 'Rabbit: Carrot  |  Wolf: Dried Fish  |  Fox: Berry', color: '#aaa' },
        { text: 'Horse: Wheat', color: '#aaa' },
        { text: '50% chance per attempt. Tamed animals follow you.', color: '#aaa' },
        { text: '' },
        { text: 'RIDING', color: '#ddaa44', bold: true },
        { text: 'Tame a horse, then press [E] to mount.', color: '#ccc' },
        { text: 'While riding, you move 2 tiles per turn.', color: '#aaa' },
        { text: 'Press [E] near your mount to dismount.', color: '#aaa' },
        { text: '' },
        { text: 'COMBAT', color: '#dd6644', bold: true },
        { text: 'Attack hostile animals with [E] then direction.', color: '#ccc' },
        { text: 'Defeating wolves/boars/bears drops Leather.', color: '#aaa' },
      ],
    },
    {
      title: 'DUNGEONS & COMBAT',
      lines: [
        { text: 'ENTERING', color: '#ddaa44', bold: true },
        { text: 'Find stone ruins on the overworld.', color: '#ccc' },
        { text: 'Walk onto the entrance to descend.', color: '#aaa' },
        { text: '' },
        { text: 'COMBAT', color: '#ddaa44', bold: true },
        { text: 'Move into enemies to melee attack.', color: '#ccc' },
        { text: '[1-4] to use abilities, then pick a direction.', color: '#aaa' },
        { text: 'Find shrines to gain new abilities.', color: '#aaa' },
        { text: 'Loot drops from enemies — walk over to pick up.', color: '#aaa' },
        { text: '' },
        { text: 'RETURNING', color: '#ddaa44', bold: true },
        { text: 'Floor 1 has blue exit stairs at the spawn point.', color: '#ccc' },
        { text: 'Walk onto them to return to the overworld.', color: '#aaa' },
        { text: '' },
        { text: 'NIGHT SPAWNS', color: '#dd6644', bold: true },
        { text: 'Ruins spawn monsters at night on the overworld.', color: '#ccc' },
        { text: 'Destroy the dungeon heart (boss) to stop spawns.', color: '#aaa' },
        { text: 'Cleared ruins become renewable resource nodes.', color: '#aaa' },
        { text: '' },
        { text: 'WARNING', color: '#ff4444', bold: true },
        { text: 'Death is permanent. You lose everything.', color: '#ff8888' },
        { text: 'Your village, items, skills — all gone.', color: '#ff8888' },
        { text: 'Be careful in the ruins.', color: '#ff8888' },
      ],
    },
    {
      title: 'WORLD & WEATHER',
      lines: [
        { text: 'BIOMES', color: '#ddaa44', bold: true },
        { text: 'Grassland — trees, flowers, common resources', color: '#4a7a3a' },
        { text: 'Forest — dense trees, mushrooms, darker', color: '#2a5a1a' },
        { text: 'Desert — sand, cacti, dry and hot', color: '#c4a44a' },
        { text: 'Tundra — frozen earth, snow pines, ice', color: '#9ab0c2' },
        { text: 'Swamp — murky water, dead trees, mushroom logs', color: '#4a5a2a' },
        { text: '' },
        { text: 'WEATHER', color: '#ddaa44', bold: true },
        { text: 'Changes with the seasons.', color: '#ccc' },
        { text: 'Spring: rain common, good for farming', color: '#aaa' },
        { text: 'Summer: mostly clear and sunny', color: '#aaa' },
        { text: 'Autumn: cloudy, fog, first snow', color: '#aaa' },
        { text: 'Winter: heavy snow, crops barely grow', color: '#aaa' },
        { text: '' },
        { text: 'TIME', color: '#ddaa44', bold: true },
        { text: 'Day/night cycle affects lighting.', color: '#ccc' },
        { text: 'NPCs sleep at night and work during the day.', color: '#aaa' },
      ],
    },
  ],

  onEnter: function(game) { this._page = 0; },

  onKey: function(game, key) {
    var lk = key.toLowerCase();
    if (lk === 'escape' || lk === 'h') { StateStack.pop(); return true; }
    if (key === 'ArrowRight' || lk === 'd' || lk === 'enter' || lk === ' ') {
      this._page = (this._page + 1) % this._pages.length;
      return true;
    }
    if (key === 'ArrowLeft' || lk === 'a') {
      this._page = (this._page - 1 + this._pages.length) % this._pages.length;
      return true;
    }
    return true;
  },

  onDraw: function(game, ctx) {
    var w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
    var fs = Math.max(12, Math.round(w * 0.013));
    var page = this._pages[this._page];

    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, w, h);

    // Title bar
    ctx.fillStyle = '#ddaa44';
    ctx.font = 'bold ' + Math.round(fs * 1.6) + 'px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('HELP — ' + page.title, w / 2, fs * 2.5);

    // Page indicator
    ctx.fillStyle = '#666';
    ctx.font = Math.round(fs * 0.8) + 'px Segoe UI';
    ctx.fillText('Page ' + (this._page + 1) + ' / ' + this._pages.length + '    \u2190\u2192 to browse    [H] or [ESC] to close', w / 2, fs * 4);

    // Content — accumulated Y, left-aligned with margin
    // Dynamically scale line height to fit all content on screen
    var topY = fs * 6;
    var bottomY = h - fs * 3;
    var availH = bottomY - topY;
    var lineCount = 0, blankCount = 0;
    for (var li = 0; li < page.lines.length; li++) {
      if (page.lines[li].text) lineCount++; else blankCount++;
    }
    var naturalLineH = fs * 1.45;
    var neededH = lineCount * naturalLineH + blankCount * naturalLineH * 0.4;
    var lineH = naturalLineH;
    var contentFs = fs;
    if (neededH > availH) {
      // Scale down to fit
      var scale = availH / neededH;
      lineH = naturalLineH * scale;
      if (scale < 0.8) contentFs = Math.round(fs * Math.max(0.75, scale));
    }
    var ty = topY;
    var margin = w * 0.1;
    ctx.textAlign = 'left';

    for (var i = 0; i < page.lines.length; i++) {
      var line = page.lines[i];
      if (!line.text) { ty += lineH * 0.4; continue; }
      ctx.fillStyle = line.color || '#ccc';
      ctx.font = (line.bold ? 'bold ' : '') + contentFs + 'px Segoe UI';
      ctx.fillText(line.text, margin, ty);
      ty += lineH;
    }

    // Page dots at bottom
    var dotY = h - fs * 2;
    ctx.textAlign = 'center';
    for (var i = 0; i < this._pages.length; i++) {
      ctx.fillStyle = i === this._page ? '#ddaa44' : '#444';
      ctx.beginPath();
      ctx.arc(w / 2 + (i - this._pages.length / 2 + 0.5) * (fs * 1.2), dotY, fs * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};

// H key opens help
GameEvents.on('keyDown', function(game, key) {
  if (key === 'h' || key === 'H') {
    StateStack.push(HelpState);
    return true;
  }
  return false;
});
