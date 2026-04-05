
// ============================================================
// SYSTEM: Obelisk — win condition structure powered by dungeon hearts
// ============================================================

// --- Dungeon Heart resource ---
ResourceRegistry.add({ id: 'dungeon_heart', name: 'Dungeon Heart', color: '#ff2255', category: 'quest', stackMax: 10 });

// --- Obelisk Manager ---
var ObeliskManager = {
  tier: 0,
  placed: false,
  x: 0,
  y: 0,

  TIER_COSTS: [
    { dungeon_heart: 1, stone: 30, oak_log: 20 },
    { dungeon_heart: 1, iron_bar: 5, copper_bar: 5, plank: 10 },
    { dungeon_heart: 1, gold_bar: 3, gem: 5, feast: 2 },
    { dungeon_heart: 1, crystal_fire: 2, crystal_ice: 2, crystal_lightning: 2, crystal_void: 2 },
    { dungeon_heart: 1, crystal_sword: 1, enchanted_armor: 1, gem: 10, gold_bar: 5 },
  ],

  TIER_COLORS: [
    '#888888', // 0: grey (base built)
    '#4488ff', // 1: blue
    '#44cc66', // 2: green
    '#ffcc22', // 3: gold
    '#aa44ff', // 4: purple
    '#ffffff', // 5: white (complete)
  ],

  TIER_NAMES: [
    'Foundation', 'Awakened', 'Attuned', 'Radiant', 'Ascendant', 'Purified'
  ],

  interact: function(game) {
    var p = game.player;
    var tier = ObeliskManager.tier;
    var tierName = ObeliskManager.TIER_NAMES[tier];
    var color = ObeliskManager.TIER_COLORS[tier];

    GameUtils.addLog('=== Obelisk (' + tierName + ') Tier ' + tier + '/5 ===', color);

    if (tier >= 5) {
      GameUtils.addLog('The Obelisk radiates pure light. The world is saved.', '#ffffff');
      return;
    }

    var cost = ObeliskManager.TIER_COSTS[tier];
    var nextName = ObeliskManager.TIER_NAMES[tier + 1];

    if (Bag.hasAll(p.bag, cost)) {
      Bag.removeAll(p.bag, cost);
      ObeliskManager.tier++;
      var newTier = ObeliskManager.tier;
      var newColor = ObeliskManager.TIER_COLORS[newTier];
      // Persist highest tier in meta so legacy remembers progress
      if (game.meta && newTier > (game.meta.obeliskTierReached || 0)) {
        game.meta.obeliskTierReached = newTier;
        saveMeta(game.meta);
      }

      if (newTier === 5) {
        GameUtils.addLog('THE OBELISK IS COMPLETE! The world is purified!', '#ffffff');
        GameUtils.addLog('You have won. The void retreats forever.', '#ffcc44');
        GameEvents.fire('victory', game);
      } else {
        GameUtils.addLog('Obelisk Tier ' + newTier + '! The corruption recedes...', newColor);
        GameUtils.addLog('The obelisk hums with ' + ObeliskManager.TIER_NAMES[newTier] + ' power.', newColor);
      }
    } else {
      GameUtils.addLog('Next tier (' + nextName + ') requires:', '#ccaa66');
      for (var id in cost) {
        var need = cost[id];
        var have = p.bag[id] || 0;
        var def = ResourceRegistry.get(id);
        var name = def ? def.name : id;
        var met = have >= need;
        GameUtils.addLog('  ' + name + ': ' + have + '/' + need + (met ? ' OK' : ''), met ? '#88cc88' : '#cc6644');
      }
    }
  },
};

// --- Obelisk Tile ---
var T_OBELISK = TileRegistry.add({
  id: 217,
  name: 'obelisk',
  solid: true,
  light: { color: '#8866ff', radius: 3, intensity: 0.4 },
  onInteract: function(game, wx, wy) {
    ObeliskManager.interact(game);
  },
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var tier = ObeliskManager.tier;
    var color = ObeliskManager.TIER_COLORS[tier];

    // Ground under pedestal — dark stone
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(sx, sy, ts, ts);

    // Stone pedestal base
    ctx.fillStyle = '#555555';
    ctx.fillRect(sx + 2 * m, sy + 10 * m, 12 * m, 6 * m);
    ctx.fillStyle = '#666666';
    ctx.fillRect(sx + 3 * m, sy + 10 * m, 10 * m, 2 * m);

    // Main shaft — extends upward beyond tile
    var shaftW = 4 * m;
    var shaftX = sx + 6 * m;
    var shaftTop = sy - 10 * m - tier * 2 * m; // grows taller with tier
    var shaftBot = sy + 10 * m;

    // Shaft shadow (left side darker)
    ctx.fillStyle = shadeHex(color, -40);
    ctx.fillRect(shaftX, shaftTop, shaftW, shaftBot - shaftTop);

    // Shaft main body
    ctx.fillStyle = color;
    ctx.fillRect(shaftX + 1 * m, shaftTop, (shaftW - 1 * m), shaftBot - shaftTop);

    // Shaft highlight (right edge)
    ctx.fillStyle = shadeHex(color, 30);
    ctx.fillRect(shaftX + shaftW - 1 * m, shaftTop + 2 * m, 1 * m, (shaftBot - shaftTop) - 4 * m);

    // Pointed tip
    ctx.beginPath();
    ctx.moveTo(shaftX, shaftTop);
    ctx.lineTo(shaftX + shaftW / 2, shaftTop - 4 * m);
    ctx.lineTo(shaftX + shaftW, shaftTop);
    ctx.closePath();
    ctx.fillStyle = shadeHex(color, 20);
    ctx.fill();

    // Tier markings — horizontal lines on shaft
    for (var i = 0; i < tier; i++) {
      var markY = shaftBot - 3 * m - i * 4 * m;
      if (markY > shaftTop) {
        ctx.fillStyle = shadeHex(color, 50);
        ctx.fillRect(shaftX + 1 * m, markY, shaftW - 2 * m, 1 * m);
      }
    }

    // Tier 3+: glowing particles
    if (tier >= 3 && animTimer !== undefined) {
      var pulse = Math.sin(animTimer * 3) * 0.3 + 0.5;
      var particleCount = tier >= 5 ? 8 : (tier >= 4 ? 6 : 4);
      for (var pi = 0; pi < particleCount; pi++) {
        var angle = (animTimer * 0.8 + pi * (Math.PI * 2 / particleCount));
        var radius = (3 + Math.sin(animTimer * 2 + pi) * 1.5) * m;
        var px = shaftX + shaftW / 2 + Math.cos(angle) * radius;
        var py = (shaftTop + shaftBot) / 2 + Math.sin(angle) * radius * 1.5;
        var pSize = (0.5 + pulse * 0.5) * m;
        ctx.globalAlpha = 0.4 + pulse * 0.3;
        ctx.fillStyle = tier >= 5 ? '#ffffff' : color;
        ctx.fillRect(px - pSize / 2, py - pSize / 2, pSize, pSize);
      }
      ctx.globalAlpha = 1.0;
    }

    // Tier 5: brilliant white glow
    if (tier === 5 && animTimer !== undefined) {
      var glowPulse = Math.sin(animTimer * 2) * 0.15 + 0.25;
      var cx = shaftX + shaftW / 2;
      var cy = (shaftTop + shaftBot) / 2;
      for (var gi = 3; gi >= 1; gi--) {
        var gr = gi * 4 * m;
        ctx.globalAlpha = glowPulse / gi;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, gr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }
  },
});

// --- Blueprint ---
BlueprintRegistry.add({
  id: 'obelisk',
  name: 'Obelisk',
  desc: 'Purifies the world. Requires dungeon hearts.',
  cost: { stone: 20, iron_bar: 5 },
  size: { w: 1, h: 1 },
  tiles: [{ dx: 0, dy: 0, type: T_OBELISK }],
  isObelisk: true,
});

// --- Detect obelisk placement via buildingPlaced event ---
GameEvents.on('buildingPlaced', function(game, building) {
  if (building.blueprint && building.blueprint.id === 'obelisk') {
    ObeliskManager.placed = true;
    ObeliskManager.x = building.x;
    ObeliskManager.y = building.y;
    GameUtils.addLog('The Obelisk stands. Feed it Dungeon Hearts to purify the world.', '#8866ff');
  }
});

// --- Dungeon heart drop on boss kill ---
GameEvents.on('kill', function(game, enemy) {
  if (enemy.isBoss && game.player.mode === 'dungeon') {
    Bag.add(game.player.bag, 'dungeon_heart', 1);
    GameUtils.addLog('The dungeon heart pulses with dark energy...', '#ff2255');
    // Track total hearts ever collected in meta (persists across deaths)
    if (game.meta) {
      game.meta.heartsCollected = (game.meta.heartsCollected || 0) + 1;
      saveMeta(game.meta);
    }
  }
});

// --- Corruption purification on turn end ---
GameEvents.on('turnEnd', function(game) {
  if (!ObeliskManager.placed || ObeliskManager.tier < 1) return;
  if (GameTime.turn % 100 !== 0) return;

  var tier = ObeliskManager.tier;
  var radius;
  if (tier >= 5) {
    radius = 9999; // purify everything
  } else if (tier === 4) {
    radius = 40;
  } else if (tier === 3) {
    radius = 20;
  } else if (tier === 2) {
    radius = 10;
  } else {
    radius = 5;
  }

  // Check if CorruptionManager exists (may be added later)
  if (typeof CorruptionManager !== 'undefined' && CorruptionManager.corrupted) {
    var ox = ObeliskManager.x;
    var oy = ObeliskManager.y;
    var keys = Object.keys(CorruptionManager.corrupted);
    var purified = 0;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var parts = key.split(',');
      var cx = parseInt(parts[0], 10);
      var cy = parseInt(parts[1], 10);
      var dx = cx - ox;
      var dy = cy - oy;
      if (tier >= 5 || (dx * dx + dy * dy <= radius * radius)) {
        if (Math.random() < 0.2) {
          Overworld.setTile(cx, cy, 100); // revert to grass
          delete CorruptionManager.corrupted[key];
          purified++;
        }
      }
    }
    if (purified > 0) {
      GameUtils.addLog('The obelisk purifies ' + purified + ' tiles of corruption.', ObeliskManager.TIER_COLORS[tier]);
    }
  }
});

// --- Draw aura effects (world layer, camera pre-applied) ---
GameEvents.on('draw:world', function(game, ctx) {
  if (!ObeliskManager.placed) return;
  var tier = ObeliskManager.tier;
  if (tier < 3) return;

  var ts = CONFIG.TILE;
  var cx = ObeliskManager.x * ts + ts / 2;
  var cy = ObeliskManager.y * ts + ts / 2;
  var color = ObeliskManager.TIER_COLORS[tier];
  var t = game.animTimer || 0;

  // Pulsing aura — concentric circles
  var pulse = Math.sin(t * 2) * 0.1 + 0.2;
  var rings = tier >= 5 ? 5 : (tier >= 4 ? 4 : 3);
  for (var i = rings; i >= 1; i--) {
    var r = (i * 1.5 + Math.sin(t * 1.5 + i) * 0.5) * ts;
    ctx.globalAlpha = pulse / (i * 0.7);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Tier 5: golden rays
  if (tier === 5) {
    var rayCount = 8;
    var rayLen = 3 * ts;
    ctx.lineWidth = 1.5;
    for (var ri = 0; ri < rayCount; ri++) {
      var angle = t * 0.3 + ri * (Math.PI * 2 / rayCount);
      var rayPulse = Math.sin(t * 3 + ri * 0.7) * 0.15 + 0.25;
      ctx.globalAlpha = rayPulse;
      ctx.strokeStyle = '#ffcc44';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * rayLen, cy + Math.sin(angle) * rayLen);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1.0;
});

// --- Victory event ---
GameEvents.on('victory', function(game) {
  // Flash effect and persistent victory messages
  GameUtils.addLog('==================', '#ffcc44');
  GameUtils.addLog('  REMNANTS COMPLETE', '#ffffff');
  GameUtils.addLog('  The corruption is banished.', '#88ff88');
  GameUtils.addLog('  Your legacy lives on.', '#ffcc44');
  GameUtils.addLog('==================', '#ffcc44');
});

// --- Save/Load ---
SaveSystem.register('obelisk', {
  save: function() {
    return {
      tier: ObeliskManager.tier,
      placed: ObeliskManager.placed,
      x: ObeliskManager.x,
      y: ObeliskManager.y,
    };
  },
  load: function(data) {
    if (!data) return;
    ObeliskManager.tier = data.tier || 0;
    ObeliskManager.placed = !!data.placed;
    ObeliskManager.x = data.x || 0;
    ObeliskManager.y = data.y || 0;
  },
});
