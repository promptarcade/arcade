
// ============================================================
// SYSTEM: Void Corruption — dark energy spreads from uncleared dungeons
// ============================================================
// Corrupted tiles spread outward from uncleared dungeon entrances.
// Clearing the dungeon stops spread; corruption slowly recedes.

var T_CORRUPTED = TileRegistry.add({
  id: 216,
  name: 'corrupted_ground',
  solid: false,
  damage: 1,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = ((wx * 374761393 + wy * 668265263) >>> 0);
    var hf = (h & 0xffff) / 65535;

    // Dark purple-black base with hash-driven variation
    var tint = Math.round((hf - 0.5) * 8);
    ctx.fillStyle = shadeHex('#1a0a20', tint);
    ctx.fillRect(sx, sy, ts, ts);

    // Slightly lighter patches for texture
    var h2 = (((h >> 13) ^ h) * 1274126177) >>> 0;
    var pf = (h2 & 0xffff) / 65535;
    if (pf > 0.5) {
      ctx.fillStyle = shadeHex('#221030', tint + 3);
      ctx.fillRect(sx + 3 * m, sy + 2 * m, 10 * m, 12 * m);
    }

    // Pulsing void veins — 3-4 lines in deep purple
    var phase = animTimer * 0.8 + hf * 6.28;
    var veinAlpha = 0.4 + Math.sin(phase) * 0.2;
    ctx.strokeStyle = 'rgba(68,34,170,' + veinAlpha.toFixed(3) + ')';
    ctx.lineWidth = Math.max(0.8, m * 0.6);

    // Vein 1 — diagonal
    var v1x = ((h >> 2) % 6 + 2) * m;
    var v1y = ((h >> 5) % 4 + 1) * m;
    ctx.beginPath();
    ctx.moveTo(sx + v1x, sy + v1y);
    ctx.lineTo(sx + v1x + 5 * m, sy + v1y + 7 * m);
    ctx.lineTo(sx + v1x + 3 * m, sy + v1y + 11 * m);
    ctx.stroke();

    // Vein 2 — curving opposite
    var v2x = ((h >> 8) % 5 + 7) * m;
    var v2y = ((h >> 11) % 4 + 2) * m;
    ctx.beginPath();
    ctx.moveTo(sx + v2x, sy + v2y);
    ctx.lineTo(sx + v2x - 3 * m, sy + v2y + 6 * m);
    ctx.lineTo(sx + v2x - 1 * m, sy + v2y + 10 * m);
    ctx.stroke();

    // Vein 3 — short branch
    var v3x = ((h >> 14) % 8 + 3) * m;
    var v3y = ((h >> 17) % 6 + 5) * m;
    ctx.beginPath();
    ctx.moveTo(sx + v3x, sy + v3y);
    ctx.lineTo(sx + v3x + 4 * m, sy + v3y + 3 * m);
    ctx.stroke();

    // Vein 4 (only some tiles)
    if (hf > 0.4) {
      var v4x = ((h >> 20) % 7 + 1) * m;
      var v4y = ((h >> 23) % 5 + 8) * m;
      ctx.beginPath();
      ctx.moveTo(sx + v4x, sy + v4y);
      ctx.lineTo(sx + v4x + 6 * m, sy + v4y - 2 * m);
      ctx.stroke();
    }

    // Void energy particles — purple dots that shift with animation
    var particlePhase = animTimer * 1.2 + hf * 3.14;
    ctx.fillStyle = 'rgba(120,60,200,' + (0.5 + Math.sin(particlePhase) * 0.3).toFixed(3) + ')';
    var p1x = ((h >> 3) % 10 + 2) * m + Math.sin(particlePhase * 0.7) * m;
    var p1y = ((h >> 6) % 10 + 2) * m + Math.cos(particlePhase * 0.9) * m;
    ctx.fillRect(sx + p1x, sy + p1y, m, m);

    ctx.fillStyle = 'rgba(160,80,255,' + (0.4 + Math.sin(particlePhase + 2) * 0.25).toFixed(3) + ')';
    var p2x = ((h >> 9) % 8 + 4) * m + Math.sin(particlePhase * 1.1 + 1) * m;
    var p2y = ((h >> 12) % 8 + 4) * m + Math.cos(particlePhase * 0.8 + 2) * m;
    ctx.fillRect(sx + p2x, sy + p2y, m, m);

    // Third particle only on some tiles
    if (hf > 0.3) {
      ctx.fillStyle = 'rgba(90,40,180,' + (0.3 + Math.sin(particlePhase + 4) * 0.2).toFixed(3) + ')';
      var p3x = ((h >> 15) % 10 + 1) * m + Math.sin(particlePhase * 0.6 + 3) * m * 0.8;
      var p3y = ((h >> 18) % 10 + 1) * m + Math.cos(particlePhase * 1.3 + 1) * m * 0.8;
      ctx.fillRect(sx + p3x, sy + p3y, m * 0.8, m * 0.8);
    }
  },
  light: { color: '#6622aa', radius: 1.5, intensity: 0.15 },
});

// ---- Corruption Manager ----

var CorruptionManager = {
  // 'wx,wy' -> { source: 'ex,ey', turn: N }
  corrupted: {},
};

// ---- Protected tile types (never corrupt these) ----

function _isCorruptionProtected(tileType) {
  // Water/swamp tiles (150-153), fishing tiles (160-163), frozen pond (107)
  if (tileType >= 150 && tileType <= 153) return true;
  if (tileType >= 160 && tileType <= 163) return true;
  if (tileType === 107) return true;
  // Cave entrance
  if (tileType === 120) return true;
  // Cobblestone and building tiles (200-216)
  if (tileType >= 200 && tileType <= 216) return true;
  // Solid tiles (walls, trees, rocks, etc)
  if (TileRegistry.isSolid(tileType)) return true;
  return false;
}

// ---- Corruption Spread ----

GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  if (GameTime.turn % 50 !== 0) return;

  var p = game.player;
  var searchR = CONFIG.VIEW_W + 10;
  var MAX_RADIUS = 12;

  // Find nearby cave entrances
  var entrances = [];
  for (var dy = -searchR; dy <= searchR; dy++) {
    for (var dx = -searchR; dx <= searchR; dx++) {
      var wx = Math.round(p.x) + dx, wy = Math.round(p.y) + dy;
      var tile = Overworld.getTile(wx, wy);
      if (tile.type === 120) { // T_CAVE_ENTRANCE
        if (!DungeonSpawnManager.isClear(wx, wy)) {
          entrances.push({ x: wx, y: wy, key: wx + ',' + wy });
        }
      }
    }
  }

  // Spread from each uncleared entrance
  for (var ei = 0; ei < entrances.length; ei++) {
    var ent = entrances[ei];

    // Spread 1 tile outward from the entrance itself
    _spreadCorruptionFrom(ent.x, ent.y, ent.key, MAX_RADIUS, ent);

    // Spread 1 tile outward from existing corrupted tiles near this entrance
    for (var ckey in CorruptionManager.corrupted) {
      var c = CorruptionManager.corrupted[ckey];
      if (c.source !== ent.key) continue;
      var parts = ckey.split(',');
      var cx = parseInt(parts[0]), cy = parseInt(parts[1]);
      // Only spread from tiles within max radius
      var dist = Math.abs(cx - ent.x) + Math.abs(cy - ent.y);
      if (dist >= MAX_RADIUS) continue;
      _spreadCorruptionFrom(cx, cy, ent.key, MAX_RADIUS, ent);
    }
  }
});

function _spreadCorruptionFrom(fx, fy, sourceKey, maxRadius, ent) {
  var dirs = [
    { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 },
  ];
  for (var di = 0; di < dirs.length; di++) {
    var nx = fx + dirs[di].x, ny = fy + dirs[di].y;
    var nkey = nx + ',' + ny;

    // Already corrupted?
    if (CorruptionManager.corrupted[nkey]) continue;

    // Check distance from source entrance
    var dist = Math.abs(nx - ent.x) + Math.abs(ny - ent.y);
    if (dist > maxRadius) continue;

    var tile = Overworld.getTile(nx, ny);
    if (_isCorruptionProtected(tile.type)) continue;

    // Corrupt this tile
    CorruptionManager.corrupted[nkey] = {
      source: sourceKey,
      turn: GameTime.turn,
      originalType: tile.type,
    };
    Overworld.setTile(nx, ny, 216); // T_CORRUPTED

    // Kill crops on farm plots
    if (tile.type === 210) { // T_FARM_PLOT
      tile.cropGrowth = 0;
      tile.crop = null;
    }
  }
}

// ---- Corruption Receding (cleared dungeons) ----

GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  if (GameTime.turn % 30 !== 0) return;

  var toRemove = [];

  for (var ckey in CorruptionManager.corrupted) {
    var c = CorruptionManager.corrupted[ckey];
    // Check if source entrance has been cleared
    var srcParts = c.source.split(',');
    var sx = parseInt(srcParts[0]), sy = parseInt(srcParts[1]);
    if (!DungeonSpawnManager.isClear(sx, sy)) continue;

    // 10% chance to revert per tick
    if (Math.random() < 0.1) {
      toRemove.push(ckey);
    }
  }

  for (var i = 0; i < toRemove.length; i++) {
    var key = toRemove[i];
    var parts = key.split(',');
    var wx = parseInt(parts[0]), wy = parseInt(parts[1]);
    var entry = CorruptionManager.corrupted[key];

    // Revert to original type if we stored it, otherwise grass
    var revertType = (entry && entry.originalType) ? entry.originalType : 100;
    Overworld.setTile(wx, wy, revertType);
    delete CorruptionManager.corrupted[key];

    // Subtle visual feedback
    if (typeof GameUtils !== 'undefined' && GameUtils.addFloating) {
      var p = game.player;
      if (Math.abs(wx - p.x) < CONFIG.VIEW_W && Math.abs(wy - p.y) < CONFIG.VIEW_H) {
        GameUtils.addFloating(wx, wy, 'Purified', '#88cc88');
      }
    }
  }
});

// ---- Visual Overlay: purple tint on tiles adjacent to corruption ----

GameEvents.on('draw:world', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  var ts = CONFIG.TILE;
  var p = game.player;
  var viewR = CONFIG.VIEW_W + 2;

  for (var dy = -viewR; dy <= viewR; dy++) {
    for (var dx = -viewR; dx <= viewR; dx++) {
      var wx = Math.round(p.x) + dx, wy = Math.round(p.y) + dy;
      var key = wx + ',' + wy;

      // Skip tiles that are themselves corrupted
      if (CorruptionManager.corrupted[key]) continue;

      // Check if any neighbor is corrupted
      var hasCorruptedNeighbor = false;
      if (CorruptionManager.corrupted[(wx - 1) + ',' + wy] ||
          CorruptionManager.corrupted[(wx + 1) + ',' + wy] ||
          CorruptionManager.corrupted[wx + ',' + (wy - 1)] ||
          CorruptionManager.corrupted[wx + ',' + (wy + 1)]) {
        hasCorruptedNeighbor = true;
      }

      if (hasCorruptedNeighbor) {
        ctx.fillStyle = 'rgba(30,10,50,0.15)';
        ctx.fillRect(wx * ts, wy * ts, ts, ts);
      }
    }
  }
});

// ---- Save/Load ----

SaveSystem.register('corruption', {
  save: function() {
    return CorruptionManager.corrupted;
  },
  load: function(data) {
    if (data) {
      CorruptionManager.corrupted = data;
    }
  },
});
