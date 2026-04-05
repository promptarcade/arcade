
// ============================================================
// SYSTEM: Spear — fishing tool AND combat weapon
// ============================================================
// The spear serves dual purpose:
// - Fishing: works like a fishing rod but from shallows/water
// - Combat: melee weapon with reach (2 tiles)

// Register spear tools
var SPEAR_TOOLS = {
  wooden_spear:  { name: 'Wooden Spear',  skill: 'fishing', tier: 1, durability: 15, color: '#886644', atk: 4, range: 1 },
  iron_spear:    { name: 'Iron Spear',    skill: 'fishing', tier: 2, durability: 35, color: '#8888aa', atk: 7, range: 1 },
};

// Register resources
ResourceRegistry.add({ id: 'wooden_spear', name: 'Wooden Spear', color: '#886644', category: 'tool', stackMax: 3 });
ResourceRegistry.add({ id: 'iron_spear', name: 'Iron Spear', color: '#8888aa', category: 'tool', stackMax: 3 });

// Add to TOOLS registry — deferred since tools.js may load after spear.js
GameEvents.on('modeChange', function() {
  if (typeof TOOLS !== 'undefined' && !TOOLS.wooden_spear) {
    TOOLS.wooden_spear = SPEAR_TOOLS.wooden_spear;
    TOOLS.iron_spear = SPEAR_TOOLS.iron_spear;
    if (typeof TOOL_REQUIREMENTS !== 'undefined') {
      TOOL_REQUIREMENTS.fishing.tierNames[1] = 'Fishing Rod or Spear';
    }
  }
});

// Recipes
RecipeRegistry.addAll([
  { skill: 'gathering', level: 1, name: 'Wooden Spear', input: { branch: 4, flint: 2 }, output: { wooden_spear: 1 } },
  { skill: 'mining', level: 2, name: 'Iron Spear', input: { oak_log: 1, iron_bar: 2 }, output: { iron_spear: 1 }, requires: ['Wooden Spear', 'Iron Bar'] },
]);

// Override checkTool to also accept spears for fishing — deferred
var _spearToolPatched = false;
GameEvents.on('modeChange', function() {
  if (_spearToolPatched || typeof checkTool === 'undefined') return;
  _spearToolPatched = true;
  var _origCheckTool = checkTool;
  checkTool = function(player, skillId) {
    var result = _origCheckTool(player, skillId);
    if (result.allowed) return result;
    if (skillId === 'fishing') {
      if (Bag.has(player.bag, 'iron_spear')) return { allowed: true, toolId: 'iron_spear', message: '' };
      if (Bag.has(player.bag, 'wooden_spear')) return { allowed: true, toolId: 'wooden_spear', message: '' };
    }
    return result;
  };
});

// Spear as equippable weapon — interact with spear in bag to equip
// When equipped, gives ATK bonus and a melee ability with range
GameEvents.on('keyDown', function(game, key) {
  // No special key — spears are equipped via the inventory stash system
  // They enter the stash as weapons when found/crafted
  return false;
});

// When player crafts a spear, auto-add weapon version to stash
// Deferred — CraftingState loads after systems
var _spearCraftPatched = false;
GameEvents.on('turnEnd', function(game) {
  if (_spearCraftPatched) return;
  var cs = window['Crafting' + 'State'];
  if (!cs) return;
  _spearCraftPatched = true;
  var _origCraftSpear = cs._craft;
  cs._craft = function(game) {
    var prevBag = {};
    for (var id in game.player.bag) prevBag[id] = game.player.bag[id];
    _origCraftSpear.call(this, game);
    var spears = ['wooden_spear', 'iron_spear'];
    for (var i = 0; i < spears.length; i++) {
      var sid = spears[i];
      if ((game.player.bag[sid] || 0) > (prevBag[sid] || 0)) {
        var sp = SPEAR_TOOLS[sid];
        if (!game.player.stash) game.player.stash = [];
        game.player.stash.push({
          type: 'weapon', name: sp.name, range: sp.range, damage: sp.atk + 3,
          cd: 0, atk: sp.atk, color: sp.color, desc: 'Spear — fish and fight'
        });
        GameUtils.addLog(sp.name + ' added to equipment stash.', '#886644');
      }
    }
  };
});
