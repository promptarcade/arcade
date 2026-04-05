
// ============================================================
// SYSTEM: Trails — walking wears paths into the ground
// ============================================================
// Walk over tiles repeatedly to create trails:
//   1-2 passes: faint cosmetic darkening
//   3-5 passes: worn trail tile (T_WORN_TRAIL)
//   6+ passes: permanent dirt path (T_DIRT_PATH id 101)
// Trails below 6 wear decay by 1 every 200 turns.

var TRAIL_WORN_THRESHOLD = 3;
var TRAIL_PERMANENT_THRESHOLD = 6;
var TRAIL_DECAY_INTERVAL = 200;

var TrailManager = {
  trails: {},      // 'wx,wy' -> wearCount
  lastWalked: {},  // 'wx,wy' -> turn number when last walked on

  increment: function(wx, wy, amount) {
    amount = amount || 1;
    var key = wx + ',' + wy;
    var prev = this.trails[key] || 0;
    var next = prev + amount;
    this.trails[key] = next;
    this.lastWalked[key] = GameTime.turn;

    // Upgrade tile at thresholds
    if (prev < TRAIL_PERMANENT_THRESHOLD && next >= TRAIL_PERMANENT_THRESHOLD) {
      Overworld.setTile(wx, wy, 101); // T_DIRT_PATH
    } else if (prev < TRAIL_WORN_THRESHOLD && next >= TRAIL_WORN_THRESHOLD) {
      Overworld.setTile(wx, wy, T_WORN_TRAIL);
    }
  },

  getWear: function(wx, wy) {
    return this.trails[wx + ',' + wy] || 0;
  },

  decay: function() {
    var now = GameTime.turn;
    for (var key in this.trails) {
      var wear = this.trails[key];
      if (wear >= TRAIL_PERMANENT_THRESHOLD) continue; // permanent, no decay
      // Don't decay trails walked on in the last 100 turns
      var lastUsed = this.lastWalked[key] || 0;
      if (now - lastUsed < 100) continue;
      wear--;
      if (wear <= 0) {
        delete this.trails[key];
        delete this.lastWalked[key];
        // Revert worn trail tiles to grass
        var parts = key.split(',');
        var wx = parseInt(parts[0], 10), wy = parseInt(parts[1], 10);
        var tile = Overworld.getTile(wx, wy);
        if (tile.type === T_WORN_TRAIL) {
          Overworld.setTile(wx, wy, 100); // revert to grassland
        }
      } else {
        this.trails[key] = wear;
        if (wear < TRAIL_WORN_THRESHOLD) {
          var parts2 = key.split(',');
          var wx2 = parseInt(parts2[0], 10), wy2 = parseInt(parts2[1], 10);
          var tile2 = Overworld.getTile(wx2, wy2);
          if (tile2.type === T_WORN_TRAIL) {
            Overworld.setTile(wx2, wy2, T_GRASS);
          }
        }
      }
    }
  },

  clear: function() { this.trails = {}; },
};

// Worn trail tile
var T_WORN_TRAIL = TileRegistry.add({
  id: 215, name: 'worn_trail', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 73856093 + (wy||0) * 19349669) >>> 0);
    // Base — lighter brown
    ctx.fillStyle = shadeHex('#9a8a6a', ((h % 7) - 3) * 3);
    ctx.fillRect(sx, sy, ts, ts);
    // Footprint impressions
    ctx.fillStyle = shadeHex('#9a8a6a', -25);
    var fx1 = (3 + (h % 4)) * m, fy1 = (3 + ((h >> 3) % 3)) * m;
    ctx.fillRect(sx + fx1, sy + fy1, 2 * m, 3 * m);
    ctx.fillRect(sx + fx1, sy + fy1 - m, 2 * m, m);
    var fx2 = (8 + ((h >> 5) % 3)) * m, fy2 = (8 + ((h >> 7) % 3)) * m;
    ctx.fillRect(sx + fx2, sy + fy2, 2 * m, 3 * m);
    ctx.fillRect(sx + fx2, sy + fy2 - m, 2 * m, m);
    // Grass tufts at edges
    var grassCols = ['#5a7a3a', '#4e6e32', '#6a8a42'];
    for (var t = 0; t < 3; t++) {
      var gh = (h * (t + 7) * 41) >>> 0;
      var edge = gh % 4;
      var gx = edge < 2 ? ((gh >> 4) % 12) * m : (edge === 2 ? 0 : 14 * m);
      var gy = edge >= 2 ? ((gh >> 4) % 12) * m : (edge === 0 ? 0 : 14 * m);
      ctx.fillStyle = grassCols[t];
      ctx.fillRect(sx + gx, sy + gy, m, 2 * m);
    }
  },
});

// Track player's previous position for trail marking
var _trailPrevX, _trailPrevY;

// On player move, mark trail at the position they LEFT
GameEvents.on('playerMove', function(game, nx, ny) {
  if (game.player.mode !== 'overworld') return;
  if (_trailPrevX !== undefined) {
    var tile = Overworld.getTile(_trailPrevX, _trailPrevY);
    // Only trail on natural ground — not buildings, roads, paths, or special tiles
    var tt = tile.type;
    var isBuilding = (tt >= 200 && tt <= 217); // building tiles, stores, obelisk
    var isPath = (tt === 101 || tt === 206 || tt === 215); // dirt path, cobblestone, worn trail
    var isSpecial = (tt >= 120 && tt <= 123) || (tt >= 160 && tt <= 163) || tt === 210; // ruins, fishing, farm
    var isWater = (tt === T.WATER || tt === T.SHALLOWS || tt === T.BEACH);
    if (!TileRegistry.isSolid(tt) && !isBuilding && !isPath && !isSpecial && !isWater) {
      TrailManager.increment(_trailPrevX, _trailPrevY);
    }
  }
  _trailPrevX = nx;
  _trailPrevY = ny;
});

// Caravan movement leaves heavier trails (2x wear)
GameEvents.on('caravanMove', function(game, cx, cy) {
  var tile = Overworld.getTile(cx, cy);
  var ct = tile.type;
  var isBuilding = (ct >= 200 && ct <= 217);
  var isPath = (ct === 101 || ct === 206 || ct === 215);
  var isSpecial = (ct >= 120 && ct <= 123) || (ct >= 160 && ct <= 163) || ct === 210;
  var isWater = (ct === T.WATER || ct === T.SHALLOWS || ct === T.BEACH);
  if (!TileRegistry.isSolid(ct) && !isBuilding && !isPath && !isSpecial && !isWater) {
    TrailManager.increment(cx, cy, 2);
  }
});

// Faint trail overlay for wear 1-2 (drawn after the tile)
GameEvents.on('draw:world', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  var ts = CONFIG.TILE;
  var px = Math.round(game.player.x), py = Math.round(game.player.y);
  var vw = CONFIG.VIEW_W + 2, vh = CONFIG.VIEW_H + 2;

  for (var dy = -vh; dy <= vh; dy++) {
    for (var dx = -vw; dx <= vw; dx++) {
      var wx = px + dx, wy = py + dy;
      var wear = TrailManager.getWear(wx, wy);
      if (wear < 1 || wear >= TRAIL_WORN_THRESHOLD) continue;
      var alpha = wear === 1 ? 0.06 : 0.12;
      ctx.fillStyle = 'rgba(60,40,20,' + alpha + ')';
      ctx.fillRect(wx * ts, wy * ts, ts, ts);
    }
  }
});

// Decay pass
GameEvents.on('turnEnd', function(game) {
  if (GameTime.turn % TRAIL_DECAY_INTERVAL === 0) {
    TrailManager.decay();
  }
});

// Save/load
SaveSystem.register('trails', {
  save: function() { return { trails: TrailManager.trails, lastWalked: TrailManager.lastWalked }; },
  load: function(data) {
    TrailManager.trails = (data && data.trails) ? data.trails : {};
    TrailManager.lastWalked = (data && data.lastWalked) ? data.lastWalked : {};
  },
});
