
// ============================================================
// SYSTEM: Swimming — player can enter water tiles, moves slowly
// ============================================================
// Water and shallows are normally impassable. With swimming:
// - Shallows: always walkable (slow)
// - Water: walkable but drains 1 HP per turn
// - Deep water (T.WALL type ocean): still impassable
// Player moves at half speed in water (extra turn cooldown)

// Override isPassable to allow water/shallows
var _origIsPassableSwim = Overworld.isPassable;
Overworld.isPassable = function(wx, wy) {
  var tile = this.getTile(wx, wy);
  // Allow shallows and water (but not walls/solid)
  if (tile.type === T.SHALLOWS) return true;
  if (tile.type === T.WATER) return true;
  return _origIsPassableSwim.call(Overworld, wx, wy);
};

// Slow movement in water — extra turn cooldown
GameEvents.on('playerMove', function(game, nx, ny) {
  if (game.player.mode !== 'overworld') return;
  var tile = Overworld.getTile(nx, ny);
  if (tile.type === T.WATER || tile.type === T.SHALLOWS || tile.type === 162 || tile.type === 160 || tile.type === 161) {
    game.turnCooldown += 0.08; // slower movement
    game.player.walkTimer = 0.5; // longer walk animation
  }
});

// Water damage — 1 HP per turn in deep overworld water
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  var px = Math.round(game.player.x), py = Math.round(game.player.y);
  var tile = Overworld.getTile(px, py);
  if (tile.type === T.WATER) {
    game.player.hp -= 1;
    if (GameTime.turn % 3 === 0) {
      GameUtils.addLog('Swimming... -1 HP', '#4488cc');
    }
    GameUtils.addFloating(px, py, '-1', '#4488cc');
    if (game.player.hp <= 0) { game.player.hp = 0; game.die(); }
  }
});

// Cold damage — standing in any water (overworld or dungeon) chills
GameEvents.on('turnEnd', function(game) {
  var px = Math.round(game.player.x), py = Math.round(game.player.y);
  var inWater = false;
  if (game.player.mode === 'overworld' && typeof Overworld !== 'undefined') {
    var tile = Overworld.getTile(px, py);
    inWater = (tile.type === T.WATER || tile.type === T.SHALLOWS);
  } else if (game.player.mode === 'dungeon' && game.dungeon) {
    if (px >= 0 && px < CONFIG.MAP_W && py >= 0 && py < CONFIG.MAP_H) {
      inWater = (game.dungeon.map[py][px] === T.WATER);
    }
  }
  if (!inWater) { game.player._coldTurns = 0; return; }
  // Cold builds up over time
  if (!game.player._coldTurns) game.player._coldTurns = 0;
  game.player._coldTurns++;
  // After 3 turns in water, start taking cold damage
  if (game.player._coldTurns > 3 && game.player._coldTurns % 2 === 0) {
    game.player.hp -= 1;
    GameUtils.addFloating(px, py, 'Cold', '#66ccff');
    if (game.player._coldTurns === 4) {
      GameUtils.addLog('The cold water saps your strength...', '#66aacc');
    }
    if (game.player.hp <= 0) { game.player.hp = 0; game.die(); }
  }
});

// Ripple effect around player when in water (overworld and dungeon)
GameEvents.on('draw:entities', function(game, ctx) {
  var px = Math.round(game.player.x), py = Math.round(game.player.y);
  var inWater = false;
  if (game.player.mode === 'overworld' && typeof Overworld !== 'undefined') {
    var tile = Overworld.getTile(px, py);
    inWater = (tile.type === T.WATER || tile.type === T.SHALLOWS || tile.type === 162 || tile.type === 160 || tile.type === 161);
  } else if (game.player.mode === 'dungeon' && game.dungeon) {
    if (px >= 0 && px < CONFIG.MAP_W && py >= 0 && py < CONFIG.MAP_H) {
      inWater = (game.dungeon.map[py][px] === T.WATER);
    }
  }
  if (inWater) {
    var ts = CONFIG.TILE;
    var m = ts / 16;
    var sx = game.player.x * ts, sy = game.player.y * ts;
    var pulse = Math.sin(game.animTimer * 4) * m;
    // Ripple rings at mid-tile
    ctx.strokeStyle = 'rgba(100,180,255,0.3)';
    ctx.lineWidth = Math.max(0.5, m * 0.5);
    ctx.beginPath();
    ctx.ellipse(sx + 8 * m, sy + 10 * m + pulse * 0.5, 6 * m, 2 * m, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
});

// Swimming rotation is handled directly in drawEntities (62-drawing-chars.js)
// by checking the tile at the player's position — no flag needed.
