
// ============================================================
// SYSTEM: Tools — required for advanced gathering, have durability
// ============================================================

// Tool definitions: what they unlock, durability, tier
var TOOLS = {
  stone_axe:     { name: 'Stone Axe',     skill: 'woodcutting', tier: 1, durability: 20, color: '#888877' },
  iron_axe:      { name: 'Iron Axe',      skill: 'woodcutting', tier: 2, durability: 50, color: '#8888aa' },
  stone_pickaxe: { name: 'Stone Pickaxe', skill: 'mining',      tier: 1, durability: 15, color: '#888877' },
  iron_pickaxe:  { name: 'Iron Pickaxe',  skill: 'mining',      tier: 2, durability: 40, color: '#8888aa' },
  fishing_rod:   { name: 'Fishing Rod',   skill: 'fishing',     tier: 1, durability: 25, color: '#886644' },
};

// Which skills require tools (and what tier unlocks what)
var TOOL_REQUIREMENTS = {
  woodcutting: { required: true, tierNames: { 1: 'Stone Axe', 2: 'Iron Axe' } },
  mining:      { required: true, tierNames: { 1: 'Stone Pickaxe', 2: 'Iron Pickaxe' } },
  fishing:     { required: true, tierNames: { 1: 'Fishing Rod' } },
  // herbalism, gathering, farming — no tool required (bare hands)
};

// Register tool resources
for (var tid in TOOLS) {
  var t = TOOLS[tid];
  ResourceRegistry.add({ id: tid, name: t.name, color: t.color, category: 'tool', stackMax: 5 });
}

// Extra crafted items that use tool system resources
ResourceRegistry.add({ id: 'leather_armor', name: 'Leather Armor', color: '#aa7744', category: 'equipment', stackMax: 1 });
ResourceRegistry.add({ id: 'saddle', name: 'Saddle', color: '#886644', category: 'equipment', stackMax: 1 });

// Tool recipes
RecipeRegistry.addAll([
  { skill: 'gathering', level: 1, name: 'Stone Axe',     input: { branch: 3, stone: 2, flint: 1 }, output: { stone_axe: 1 } },
  { skill: 'gathering', level: 1, name: 'Stone Pickaxe', input: { branch: 3, stone: 3, flint: 1 }, output: { stone_pickaxe: 1 }, requires: ['Stone Axe'] },
  { skill: 'gathering', level: 2, name: 'Fishing Rod',   input: { branch: 2, worm: 1 },            output: { fishing_rod: 1 } },
  { skill: 'mining',    level: 2, name: 'Iron Axe',      input: { oak_log: 2, iron_bar: 1 },       output: { iron_axe: 1 }, requires: ['Stone Axe', 'Iron Bar'] },
  { skill: 'mining',    level: 3, name: 'Iron Pickaxe',  input: { oak_log: 2, iron_bar: 2 },       output: { iron_pickaxe: 1 }, requires: ['Stone Pickaxe', 'Iron Bar'] },
  { skill: 'gathering', level: 3, name: 'Leather Armor', input: { leather: 5, branch: 2 },         output: { leather_armor: 1 }, requires: ['Stone Axe'] },
  { skill: 'gathering', level: 4, name: 'Saddle',        input: { leather: 8, plank: 3 },           output: { saddle: 1 }, requires: ['Leather Armor', 'Plank'] },
]);

// Check if player has the required tool for a skill
// Returns: { allowed: bool, toolId: string|null, message: string }
function checkTool(player, skillId) {
  var req = TOOL_REQUIREMENTS[skillId];
  if (!req || !req.required) return { allowed: true, toolId: null, message: '' };

  // Find the best tool for this skill in player's bag
  var bestTool = null, bestTier = 0;
  for (var tid in TOOLS) {
    var t = TOOLS[tid];
    if (t.skill === skillId && Bag.has(player.bag, tid)) {
      if (t.tier > bestTier) { bestTier = t.tier; bestTool = tid; }
    }
  }

  if (!bestTool) {
    // Tell the player what they need
    var needed = req.tierNames[1] || 'a tool';
    return { allowed: false, toolId: null, message: 'Need ' + needed + ' (craft with [C])' };
  }

  return { allowed: true, toolId: bestTool, message: '' };
}

// Consume durability on a tool — removes it from bag when broken
function useTool(player, toolId) {
  if (!toolId) return;
  // Track durability in a separate map on the player
  if (!player.toolDurability) player.toolDurability = {};
  if (player.toolDurability[toolId] === undefined) {
    player.toolDurability[toolId] = TOOLS[toolId].durability;
  }
  player.toolDurability[toolId]--;
  if (player.toolDurability[toolId] <= 0) {
    Bag.remove(player.bag, toolId, 1);
    delete player.toolDurability[toolId];
    var def = TOOLS[toolId];
    GameUtils.addLog(def.name + ' broke!', '#cc6644');
    // If there's another of the same tool, start fresh durability
  }
}

// Get durability display for a tool
function getToolDurability(player, toolId) {
  if (!player.toolDurability || player.toolDurability[toolId] === undefined) {
    return TOOLS[toolId] ? TOOLS[toolId].durability : 0;
  }
  return player.toolDurability[toolId];
}

// Hook into skill interactions — intercept before the skill handler runs
// We wrap the SkillRegistry.getHandlersForTile to add tool checks
var _origGetHandlers = SkillRegistry.getHandlersForTile;
SkillRegistry.getHandlersForTile = function(tileId) {
  var handlers = _origGetHandlers.call(SkillRegistry, tileId);
  if (handlers.length === 0) return handlers;

  // Wrap each handler with a tool check
  return handlers.map(function(h) {
    return {
      skill: h.skill,
      handler: function(game, tileType, wx, wy) {
        var skillId = h.skill.id;
        var check = checkTool(game.player, skillId);
        if (!check.allowed) {
          GameUtils.addLog(check.message, '#cc8844');
          return true; // consumed the interaction, but didn't gather
        }
        var result = h.handler(game, tileType, wx, wy);
        if (result && check.toolId) {
          useTool(game.player, check.toolId);
        }
        return result;
      }
    };
  });
};

// Show equipped tool in HUD via event
GameEvents.on('draw:ui', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  if (StateStack.name() === 'title') return;
  var p = game.player;
  var fs = Math.max(10, Math.round(CONFIG.WIDTH * 0.01));
  var w = CONFIG.WIDTH;

  // Tool display — below equipment panel on top right
  var eqX = w - Math.min(180, w * 0.2) - 10;
  var ty = fs * 5.5; // below the existing equipment display

  // Find active tools
  var toolLines = [];
  for (var tid in TOOLS) {
    if (Bag.has(p.bag, tid)) {
      var t = TOOLS[tid];
      var dur = getToolDurability(p, tid);
      var maxDur = t.durability;
      var pct = Math.round(dur / maxDur * 100);
      toolLines.push({ name: t.name, dur: dur, max: maxDur, pct: pct, color: t.color });
    }
  }

  if (toolLines.length > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(eqX, ty, Math.min(180, w * 0.2), fs * (toolLines.length + 0.8));
    var tty = ty + fs * 0.8;
    ctx.textAlign = 'left';
    for (var i = 0; i < toolLines.length; i++) {
      var tl = toolLines[i];
      ctx.fillStyle = tl.color;
      ctx.font = Math.round(fs * 0.8) + 'px Segoe UI';
      ctx.fillText(tl.name + ' ' + tl.pct + '%', eqX + 5, tty);
      tty += fs * 1.0;
    }
  }
});

// Save/load tool durability
SaveSystem.register('tools', {
  save: function() {
    var p = GameUtils.player();
    return p ? (p.toolDurability || {}) : {};
  },
  load: function(data) {
    var p = GameUtils.player();
    if (p && data) p.toolDurability = data;
  },
});
