
// ============================================================
// SYSTEM: Dungeon Spawns — monsters emerge from ruins at night
// ============================================================
// Each ruin entrance spawns hostile creatures at night until
// the dungeon heart (deepest floor boss) is destroyed.
// Once cleared, the entrance becomes a renewable resource node.

var DungeonSpawnManager = {
  // Track which dungeon entrances have been cleared (heart destroyed)
  // Key: 'x,y' of entrance, value: true
  cleared: {},

  isClear: function(wx, wy) {
    return !!this.cleared[wx + ',' + wy];
  },

  markCleared: function(wx, wy) {
    this.cleared[wx + ',' + wy] = true;
  },
};

// Spawn monsters from uncleared dungeon entrances at night
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  if (!GameTime.isNight()) return;
  if (GameTime.turn % 30 !== 0) return; // every ~30 minutes at night

  var p = game.player;
  var searchR = CONFIG.VIEW_W + 5;

  // Find nearby cave entrances
  for (var dy = -searchR; dy <= searchR; dy++) {
    for (var dx = -searchR; dx <= searchR; dx++) {
      var wx = Math.round(p.x) + dx, wy = Math.round(p.y) + dy;
      var tile = Overworld.getTile(wx, wy);
      if (tile.type !== T_CAVE_ENTRANCE) continue;
      if (DungeonSpawnManager.isClear(wx, wy)) continue;

      // Cap nearby spawned monsters per entrance
      var nearEntrance = 0;
      for (var i = 0; i < AnimalManager.animals.length; i++) {
        var a = AnimalManager.animals[i];
        if (a.alive && a.hostile && !a.tamed && Math.abs(a.x - wx) + Math.abs(a.y - wy) < 8) nearEntrance++;
      }
      if (nearEntrance >= 3) continue;

      // Spawn a dungeon creature near the entrance
      var dirs = [{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0},{x:1,y:1},{x:-1,y:1},{x:1,y:-1},{x:-1,y:-1}];
      for (var di = 0; di < dirs.length; di++) {
        var sx = wx + dirs[di].x, sy = wy + dirs[di].y;
        if (Overworld.isPassable(sx, sy) && !AnimalManager.getAt(sx, sy)) {
          var monster = new Animal(sx, sy, 'wolf');
          // Override to be a dungeon spawn
          monster.name = 'Risen Skeleton';
          monster.color = '#ccccaa';
          monster.hostile = true;
          monster.tameable = false;
          monster.rideable = false;
          monster.speed = 1; // slow like shambler
          monster.hp = 10 + Math.floor(Math.random() * 8);
          monster.maxHp = monster.hp;
          monster.aggroRange = 8;
          monster._dungeonSpawn = true; // mark as dungeon spawn
          monster._entranceX = wx;
          monster._entranceY = wy;
          AnimalManager.add(monster);

          // Visual effect at entrance
          GameUtils.addFloating(wx, wy, 'A creature emerges!', '#ff6644');
          break;
        }
      }
    }
  }
});

// Draw dungeon spawn monsters with the skeleton appearance
var _origDrawAnimalPixel = drawAnimalPixel;
drawAnimalPixel = function(ctx, sx, sy, ts, animal) {
  if (animal._dungeonSpawn) {
    // Use the creature drawing system instead
    var walkPhase = animal.walkTimer > 0 ? (animal.animTimer * 0.6) % 1 : 0;
    drawCreaturePixel(ctx, sx, sy, ts, animal.color, 'shambler', walkPhase);
    return;
  }
  _origDrawAnimalPixel(ctx, sx, sy, ts, animal);
};

// When player clears a dungeon (kills the boss), mark entrance as cleared
GameEvents.on('kill', function(game, enemy) {
  if (enemy.isBoss && game.player.mode === 'dungeon') {
    // Mark the entrance this dungeon was entered from
    var wx = game.player.worldX;
    var wy = game.player.worldY;
    DungeonSpawnManager.markCleared(wx, wy);
    GameUtils.addLog('The dungeon heart has been destroyed!', '#ffcc44');
    GameUtils.addLog('This entrance is now safe.', '#aaccaa');
  }
});

// Cleared entrances become resource nodes
// Register a tile interaction for cleared cave entrances
var _origCaveInteract = TileRegistry.get(T_CAVE_ENTRANCE).onInteract;
TileRegistry.get(T_CAVE_ENTRANCE).onInteract = function(game, wx, wy) {
  if (DungeonSpawnManager.isClear(wx, wy)) {
    // Renewable resource gathering from cleared dungeon — includes rare materials
    var roll = Math.random();
    var pick;
    if (roll < 0.25) pick = { id: 'stone', count: 3, name: 'Stone' };
    else if (roll < 0.40) pick = { id: 'iron_ore', count: 2, name: 'Iron Ore' };
    else if (roll < 0.55) pick = { id: 'copper_ore', count: 2, name: 'Copper Ore' };
    else if (roll < 0.65) pick = { id: 'gold_ore', count: 1, name: 'Gold Ore' };
    else if (roll < 0.75) pick = { id: 'gem', count: 1, name: 'Gem' };
    else if (roll < 0.82) pick = { id: 'crystal_fire', count: 1, name: 'Fire Crystal' };
    else if (roll < 0.89) pick = { id: 'crystal_ice', count: 1, name: 'Ice Crystal' };
    else if (roll < 0.95) pick = { id: 'crystal_lightning', count: 1, name: 'Storm Crystal' };
    else pick = { id: 'crystal_void', count: 1, name: 'Shadow Crystal' };
    Bag.add(game.player.bag, pick.id, pick.count);
    GameUtils.addLog('Gathered ' + pick.count + 'x ' + pick.name + ' from the ruins.', '#aa8866');
    GameUtils.addFloating(wx, wy, '+' + pick.count + ' ' + pick.name, '#ddaa44');
    SFX.step();
    return;
  }
  _origCaveInteract(game, wx, wy);
};

// Visual indicator for cleared entrances
GameEvents.on('draw:world', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  var ts = CONFIG.TILE;
  var p = game.player;
  var viewR = CONFIG.VIEW_W + 2;

  for (var dy = -viewR; dy <= viewR; dy++) {
    for (var dx = -viewR; dx <= viewR; dx++) {
      var wx = Math.round(p.x) + dx, wy = Math.round(p.y) + dy;
      var tile = Overworld.getTile(wx, wy);
      if (tile.type !== T_CAVE_ENTRANCE) continue;
      if (!DungeonSpawnManager.isClear(wx, wy)) continue;

      // Draw a green glow instead of orange for cleared entrances
      var pulse = 0.2 + Math.sin(game.animTimer * 1.5) * 0.1;
      ctx.fillStyle = 'rgba(80,200,80,' + pulse.toFixed(3) + ')';
      ctx.fillRect(wx * ts + 2, wy * ts + 2, ts - 4, ts - 4);

      // "Cleared" label
      ctx.fillStyle = '#88cc88';
      ctx.font = Math.max(7, Math.round(ts * 0.22)) + 'px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText('Cleared', (wx + 0.5) * ts, wy * ts - 2);
    }
  }
});

// Save/load cleared entrances
SaveSystem.register('dungeonSpawns', {
  save: function() { return DungeonSpawnManager.cleared; },
  load: function(data) { if (data) DungeonSpawnManager.cleared = data; },
});
