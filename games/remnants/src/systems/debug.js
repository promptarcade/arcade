
// ============================================================
// SYSTEM: Debug Mode — accelerated testing (press ` to toggle)
// ============================================================

var DebugMode = {
  active: false,

  giveStarterKit: function(game) {
    var p = game.player;
    // Resources
    var items = {
      oak_log: 50, stone: 50, branch: 30, flint: 10, iron_ore: 20,
      copper_ore: 20, gold_ore: 10, plank: 20, iron_bar: 10, copper_bar: 10,
      gold_bar: 5, leather: 20, worm: 5, meadow_herb: 10, wild_berry: 10,
      wheat: 20, carrot: 10, red_mushroom: 5, brown_mushroom: 5,
      flower_petal: 5, trout: 10, salmon: 5, gem: 5,
      crystal_fire: 3, crystal_ice: 3, crystal_lightning: 3, crystal_void: 3,
      gold_coin: 200, dungeon_heart: 3, healing_salve: 5, health_potion: 3,
      dried_fish: 10, stone_axe: 2, stone_pickaxe: 2, fishing_rod: 2,
      iron_axe: 1, iron_pickaxe: 1, saddle: 1, leather_armor: 1,
    };
    for (var id in items) Bag.add(p.bag, id, items[id]);

    // Skills
    var skillIds = ['gathering', 'woodcutting', 'herbalism', 'mining', 'fishing', 'farming', 'cooking', 'combat'];
    for (var i = 0; i < skillIds.length; i++) {
      if (!p.skills[skillIds[i]]) p.skills[skillIds[i]] = { xp: 0, level: 1 };
      p.skills[skillIds[i]].level = 5;
    }

    // Track all basic recipes as crafted (for prerequisites)
    var basicRecipes = ['Stone Axe','Stone Pickaxe','Copper Bar','Iron Bar','Plank',
      'Healing Salve','Dried Fish','Bread','Leather Armor','Saddle','Iron Axe'];
    if (!p.craftedRecipes) p.craftedRecipes = {};
    for (var i = 0; i < basicRecipes.length; i++) p.craftedRecipes[basicRecipes[i]] = true;

    // Stats
    p.hp = 100; p.maxHp = 100; p.atk = 15; p.potions = 5;

    GameUtils.addLog('DEBUG: Starter kit granted', '#ff44ff');
  },

  advanceTime: function(game, hours) {
    var turns = hours * 60;
    for (var i = 0; i < turns; i++) GameTime.tick();
    GameUtils.addLog('DEBUG: Advanced ' + hours + 'h (' + turns + ' turns)', '#ff44ff');
  },

  teleport: function(game, dx, dy) {
    game.player.x += dx;
    game.player.y += dy;
    GameUtils.addLog('DEBUG: Teleported to ' + game.player.x + ',' + game.player.y, '#ff44ff');
  },

  spawnHeart: function(game) {
    Bag.add(game.player.bag, 'dungeon_heart', 1);
    GameUtils.addLog('DEBUG: +1 Dungeon Heart', '#ff2255');
  },

  healFull: function(game) {
    game.player.hp = game.player.maxHp;
    GameUtils.addLog('DEBUG: Full heal', '#44ff88');
  },

  showInfo: function(game) {
    var p = game.player;
    GameUtils.addLog('HP:' + p.hp + '/' + p.maxHp + ' ATK:' + p.atk + ' Kills:' + p.kills, '#ff44ff');
    GameUtils.addLog('Pos:' + Math.round(p.x) + ',' + Math.round(p.y) + ' Mode:' + p.mode, '#ff44ff');
    if (typeof ObeliskManager !== 'undefined') {
      GameUtils.addLog('Obelisk: tier ' + ObeliskManager.tier + '/5 placed:' + ObeliskManager.placed, '#ff44ff');
    }
    if (typeof CorruptionManager !== 'undefined') {
      var count = 0; for (var k in CorruptionManager.corrupted) count++;
      GameUtils.addLog('Corruption: ' + count + ' tiles', '#aa44ff');
    }
    var hearts = p.bag.dungeon_heart || 0;
    GameUtils.addLog('Hearts:' + hearts + ' Gems:' + (p.bag.gem||0) + ' Gold:' + (p.bag.gold_coin||0), '#ff44ff');
  },
};

// Toggle with backtick key
GameEvents.on('keyDown', function(game, key) {
  if (key === '`' || key === '~') {
    DebugMode.active = !DebugMode.active;
    GameUtils.addLog('Debug mode: ' + (DebugMode.active ? 'ON' : 'OFF'), '#ff44ff');
    return true;
  }
  if (!DebugMode.active) return false;

  // Debug hotkeys (only when debug mode is ON)
  if (key === 'F1') { DebugMode.giveStarterKit(game); return true; }
  if (key === 'F2') { DebugMode.advanceTime(game, 6); return true; }
  if (key === 'F3') { DebugMode.spawnHeart(game); return true; }
  if (key === 'F4') { DebugMode.healFull(game); return true; }
  if (key === 'F5') { DebugMode.showInfo(game); return true; }
  // Numpad teleport: 50 tiles in each direction
  if (key === 'F6') { DebugMode.teleport(game, 0, -50); return true; }  // north
  if (key === 'F7') { DebugMode.teleport(game, 50, 0); return true; }   // east
  if (key === 'F8') { DebugMode.teleport(game, 0, 50); return true; }   // south
  if (key === 'F9') { DebugMode.teleport(game, -50, 0); return true; }  // west

  return false;
}, 100); // high priority so it runs before other handlers

// HUD indicator when debug is active
GameEvents.on('draw:ui', function(game, ctx) {
  if (!DebugMode.active) return;
  if (StateStack.name() === 'title') return;
  var fs = Math.max(10, Math.round(CONFIG.WIDTH * 0.01));
  var dbgY = 56;
  ctx.fillStyle = 'rgba(40,0,40,0.7)';
  ctx.font = 'bold ' + fs + 'px Segoe UI';
  var labelW = ctx.measureText('DEBUG ').width + 10;
  ctx.font = Math.round(fs * 0.7) + 'px Segoe UI';
  var keysText = 'F1:kit F2:+6h F3:heart F4:heal F5:info F6:N F7:E F8:S F9:W';
  var keysW = ctx.measureText(keysText).width + 10;
  var dbgW = labelW + keysW + 10;
  ctx.fillRect(0, dbgY, dbgW, fs * 1.4);
  ctx.fillStyle = '#ff44ff';
  ctx.font = 'bold ' + fs + 'px Segoe UI';
  ctx.textAlign = 'left';
  ctx.fillText('DEBUG', 10, dbgY + fs * 1.0);
  ctx.fillStyle = '#cc33cc';
  ctx.font = Math.round(fs * 0.7) + 'px Segoe UI';
  ctx.fillText(keysText, 10 + labelW, dbgY + fs * 1.0);
});
