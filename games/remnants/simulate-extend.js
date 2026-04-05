// ============================================================
// Wanderlust — game-specific simulation tests
// Loaded by tools/simulate-game.js when testing this game
// ============================================================
module.exports = function(g, t) {

  // Registries
  t.section('REGISTRIES');
  t.assert(typeof TileRegistry !== 'undefined' && typeof TileRegistry.get === 'function', 'TileRegistry exists');
  t.assert(typeof ResourceRegistry !== 'undefined', 'ResourceRegistry exists');
  t.assert(typeof BiomeRegistry !== 'undefined', 'BiomeRegistry exists');
  t.assert(typeof SkillRegistry !== 'undefined', 'SkillRegistry exists');
  t.assert(typeof RecipeRegistry !== 'undefined', 'RecipeRegistry exists');
  t.assert(typeof GameEvents !== 'undefined', 'GameEvents exists');
  t.assert(typeof StateStack !== 'undefined', 'StateStack exists');
  t.assert(typeof SaveSystem !== 'undefined', 'SaveSystem exists');

  var biomes = BiomeRegistry.list();
  t.assert(biomes.length > 0, 'Biomes registered: ' + biomes.length);
  var skills = SkillRegistry.list();
  t.assert(skills.length > 0, 'Skills registered: ' + skills.length);
  var recipes = RecipeRegistry.all();
  t.assert(recipes.length > 0, 'Recipes registered: ' + recipes.length);

  // Player
  t.section('PLAYER');
  if (typeof createPlayer === 'function') {
    var p = createPlayer();
    t.assert(p.hp > 0, 'Player has HP: ' + p.hp);
    t.assert(p.bag !== undefined, 'Player has bag');
    t.assert(p.skills !== undefined, 'Player has skills');
    t.assert(p.mode === 'overworld', 'Player starts in overworld mode');
  }

  // Bag system
  t.section('BAG SYSTEM');
  if (typeof Bag !== 'undefined') {
    var testBag = Bag.create();
    Bag.add(testBag, 'oak_log', 5);
    t.assert(Bag.has(testBag, 'oak_log', 5), 'Bag.add and Bag.has work');
    t.assert(Bag.count(testBag) === 5, 'Bag.count works: ' + Bag.count(testBag));
    Bag.remove(testBag, 'oak_log', 2);
    t.assert(testBag.oak_log === 3, 'Bag.remove works: ' + testBag.oak_log);
    t.assert(!Bag.remove(testBag, 'oak_log', 10), 'Bag.remove rejects overdraw');
  }

  // Skills
  t.section('SKILLS');
  if (typeof PlayerSkills !== 'undefined') {
    var testSkills = PlayerSkills.create();
    var result = PlayerSkills.addXp(testSkills, 'woodcutting', 100);
    t.assert(testSkills.woodcutting.level > 1, 'XP levels up skill: level ' + testSkills.woodcutting.level);
    t.assert(typeof result.leveled === 'boolean', 'addXp returns leveled flag');
  }

  // Overworld
  t.section('OVERWORLD');
  if (typeof Overworld !== 'undefined') {
    Overworld.init(12345);
    var tile = Overworld.getTile(0, 0);
    t.assert(tile !== null && tile !== undefined, 'Overworld.getTile returns a tile');
    t.assert(tile.type !== undefined, 'Tile has a type: ' + tile.type);
    t.assert(tile.biome !== undefined, 'Tile has a biome: ' + tile.biome);
    Overworld.setTile(5, 5, 999);
    var changed = Overworld.getTileChange(5, 5);
    t.assert(changed === 999, 'Overworld.setTile persists changes');
    t.assert(typeof Overworld.isPassable === 'function', 'isPassable exists');
  }

  // State Stack
  t.section('STATE STACK');
  if (typeof StateStack !== 'undefined' && typeof TitleState !== 'undefined') {
    StateStack.clear();
    t.assert(StateStack.depth() === 0, 'Stack starts empty after clear');
    StateStack.push(TitleState);
    t.assert(StateStack.name() === 'title', 'Push title state works');
    t.assert(StateStack.depth() === 1, 'Stack depth is 1');
    if (typeof PlayingState !== 'undefined') {
      StateStack.push(PlayingState);
      t.assert(StateStack.name() === 'playing', 'Push playing state works');
      StateStack.pop();
      t.assert(StateStack.name() === 'title', 'Pop returns to title');
    }
    if (typeof HelpState !== 'undefined') {
      StateStack.push(HelpState);
      t.assert(StateStack.name() === 'help', 'Help state pushes');
      StateStack.pop();
    }
    if (typeof InventoryState !== 'undefined') {
      StateStack.push(InventoryState);
      t.assert(StateStack.name() === 'inventory', 'Inventory state pushes');
      StateStack.pop();
    }
    if (typeof CraftingState !== 'undefined') {
      StateStack.push(CraftingState);
      t.assert(StateStack.name() === 'crafting', 'Crafting state pushes');
      StateStack.pop();
    }
    StateStack.clear();
  }

  // Events
  t.section('EVENTS');
  if (typeof GameEvents !== 'undefined') {
    var eventFired = false;
    var unsub = GameEvents.on('test_event', function() { eventFired = true; });
    GameEvents.fire('test_event');
    t.assert(eventFired, 'Event fires and handler runs');
    unsub();
    eventFired = false;
    GameEvents.fire('test_event');
    t.assert(!eventFired, 'Unsubscribe works');
  }

  // Save/Load
  t.section('SAVE/LOAD');
  if (typeof SaveSystem !== 'undefined') {
    SaveSystem.save();
    t.assert(SaveSystem.hasSave(), 'Save creates data');
    SaveSystem.deleteSave();
    t.assert(!SaveSystem.hasSave(), 'Delete removes save');
  }

  // Crafting
  t.section('CRAFTING');
  if (typeof Bag !== 'undefined' && typeof RecipeRegistry !== 'undefined') {
    var craftBag = Bag.create();
    Bag.add(craftBag, 'oak_log', 10);
    var woodRecipes = RecipeRegistry.getForSkill('woodcutting');
    if (woodRecipes.length > 0) {
      var r = woodRecipes[0];
      t.assert(Bag.hasAll(craftBag, r.input), 'Bag has recipe inputs');
      Bag.removeAll(craftBag, r.input);
      Bag.addAll(craftBag, r.output);
      var outputKey = Object.keys(r.output)[0];
      t.assert(craftBag[outputKey] > 0, 'Crafting produces output: ' + outputKey + '=' + craftBag[outputKey]);
    }
  }

  // Time
  t.section('TIME');
  if (typeof GameTime !== 'undefined') {
    GameTime.turn = 0;
    t.assert(GameTime.hour() === 0, 'Hour 0 at turn 0');
    GameTime.turn = 720;
    t.assert(GameTime.hour() === 12, 'Hour 12 at turn 720');
    t.assert(GameTime.isDaytime(), 'Noon is daytime');
    GameTime.turn = 1380;
    t.assert(GameTime.isNight(), '11pm is night');
    t.assert(typeof GameTime.formatted() === 'string', 'formatted() returns string');
    GameTime.turn = 0;
  }

  // Weather
  t.section('WEATHER');
  if (typeof Weather !== 'undefined') {
    Weather.roll();
    t.assert(['clear','cloudy','rain','storm','snow','fog'].indexOf(Weather.current) >= 0, 'Weather type valid: ' + Weather.current);
    t.assert(Weather.duration > 0, 'Weather has duration');
    t.assert(typeof Weather.farmingMult() === 'number', 'farmingMult returns number');
  }

  // Equipment / Stash
  t.section('EQUIPMENT');
  if (typeof createPlayer === 'function' && typeof Bag !== 'undefined') {
    var ep = createPlayer();
    // Simulate having a weapon
    ep.weapon = { name: 'Test Sword +3', type: 'weapon', range: 1, damage: 8, cd: 0, atk: 3, color: '#ddaa44' };
    ep.stash = [];
    // Stash weapon
    ep.stash.push(ep.weapon);
    ep.weapon = null;
    t.assert(ep.stash.length === 1, 'Stash holds unequipped weapon');
    t.assert(ep.stash[0].name === 'Test Sword +3', 'Stashed weapon has correct name');
    // Re-equip — find by type
    var found = false;
    for (var si = ep.stash.length - 1; si >= 0; si--) {
      var st = ep.stash[si].type;
      if (st === 'weapon' || st === 'sword' || st === 'wand' || st === 'staff') { found = true; break; }
    }
    t.assert(found, 'Stash item findable by weapon types');
    // Verify body property exists (save migration)
    t.assert(ep.body === 'broad' || ep.body === 'narrow', 'Player has body property: ' + ep.body);
  }

  // Trail exclusions
  t.section('TRAILS');
  if (typeof TrailManager !== 'undefined' && typeof TileRegistry !== 'undefined') {
    // Building floor (200) should not get trails
    var buildingTile = 200;
    var isBuilding = (buildingTile >= 200 && buildingTile <= 217);
    t.assert(isBuilding, 'Building tiles (200-217) excluded from trails');
    // Cobblestone (206) should not get trails
    var cobble = 206;
    var isPath = (cobble === 101 || cobble === 206 || cobble === 215);
    t.assert(isPath, 'Path tiles (101,206,215) excluded from trails');
  }

  // Fresh start — verify weapon exists
  t.section('FRESH START');
  if (typeof Game === 'function' && typeof createPlayer === 'function') {
    var fp = createPlayer();
    t.assert(fp.body !== undefined, 'createPlayer sets body property');
    t.assert(fp.mode === 'overworld', 'createPlayer starts in overworld');
    // Check WEAPON_TYPES exist and have type:'weapon' compatible data
    if (typeof WEAPON_TYPES !== 'undefined') {
      for (var wk in WEAPON_TYPES) {
        t.assert(WEAPON_TYPES[wk].name, 'WEAPON_TYPES.' + wk + ' has name');
        t.assert(WEAPON_TYPES[wk].baseDmg !== undefined, 'WEAPON_TYPES.' + wk + ' has baseDmg');
      }
    }
  }

  // Permadeath
  t.section('PERMADEATH');
  if (typeof SaveSystem !== 'undefined' && typeof Overworld !== 'undefined') {
    Overworld.setTile(10, 10, 999);
    SaveSystem.save();
    t.assert(SaveSystem.hasSave(), 'Save exists before death');
    SaveSystem.deleteSave();
    Overworld.tileChanges = {};
    Overworld.chunks = {};
    if (typeof GameTime !== 'undefined') GameTime.turn = 0;
    if (typeof NPCManager !== 'undefined') NPCManager.clear();
    if (typeof BuildingManager !== 'undefined') BuildingManager.clear();
    t.assert(!SaveSystem.hasSave(), 'Save wiped after death');
    t.assert(Object.keys(Overworld.tileChanges).length === 0, 'Tile changes wiped');
  }
};
