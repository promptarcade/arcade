
// ============================================================
// BIOME: Desert — hot sand, cacti, oases
// ============================================================

var T_SAND = TileRegistry.add({
  id: 103,
  name: 'sand',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h1 = ((wx * 374761393 + wy * 668265263) >>> 0);
    var colorN = Math.sin(wx * 0.5 + wy * 0.7) * 6;
    ctx.fillStyle = shadeHex('#c4a44a', Math.round(colorN));
    ctx.fillRect(sx, sy, ts, ts);
    // Wind ripple lines
    var ripple = Math.sin(wx * 0.8 + wy * 1.2) * 0.5 + 0.5;
    if (ripple > 0.4) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = Math.max(0.5, m * 0.3);
      var ry = sy + ((h1 >> 4) % 8 + 4) * m;
      ctx.beginPath(); ctx.moveTo(sx, ry); ctx.lineTo(sx + ts, ry + m); ctx.stroke();
    }
    // Scattered pebbles
    if ((h1 % 11) === 0) {
      ctx.fillStyle = '#aa8844';
      ctx.beginPath(); ctx.arc(sx + ((h1 >> 3) % 10 + 3) * m, sy + ((h1 >> 7) % 8 + 5) * m, m * 0.8, 0, Math.PI * 2); ctx.fill();
    }
    // Tiny dead grass tuft
    if ((h1 % 17) === 0) {
      ctx.fillStyle = '#8a7a3a';
      ctx.fillRect(sx + ((h1 >> 5) % 10 + 3) * m, sy + 10 * m, m, 3 * m);
      ctx.fillRect(sx + ((h1 >> 5) % 10 + 4) * m, sy + 11 * m, m, 2 * m);
    }
  },
});

var T_CACTUS = TileRegistry.add({
  id: 104,
  name: 'cactus',
  solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    // Sand underneath
    var sandDraw = TileRegistry.getDrawer(T_SAND);
    if (sandDraw) sandDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);
    var m = ts / 16;
    var h = (((wx || 0) * 4517 + (wy || 0) * 7321) >>> 0);
    var variant = h % 3;
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(sx + 8 * m, sy + 14 * m, 3 * m, 1 * m, 0, 0, Math.PI * 2); ctx.fill();
    if (variant === 0) {
      // Tall single cactus
      ctx.fillStyle = '#3a7a3a';
      ctx.fillRect(sx + 6 * m, sy - 2 * m, 4 * m, 16 * m);
      ctx.fillStyle = '#2a6a2a';
      ctx.fillRect(sx + 6 * m, sy - 2 * m, 1.5 * m, 16 * m);
      // Spines
      ctx.fillStyle = '#ccddaa';
      ctx.fillRect(sx + 5 * m, sy + 2 * m, 1 * m, 0.5 * m);
      ctx.fillRect(sx + 10 * m, sy + 4 * m, 1 * m, 0.5 * m);
      ctx.fillRect(sx + 5 * m, sy + 7 * m, 1 * m, 0.5 * m);
    } else if (variant === 1) {
      // Cactus with arms
      ctx.fillStyle = '#3a7a3a';
      ctx.fillRect(sx + 6 * m, sy + 0 * m, 4 * m, 14 * m);
      ctx.fillRect(sx + 2 * m, sy + 3 * m, 4 * m, 3 * m);
      ctx.fillRect(sx + 2 * m, sy + 1 * m, 3 * m, 3 * m);
      ctx.fillRect(sx + 10 * m, sy + 5 * m, 4 * m, 3 * m);
      ctx.fillRect(sx + 11 * m, sy + 3 * m, 3 * m, 3 * m);
      ctx.fillStyle = '#2a6a2a';
      ctx.fillRect(sx + 6 * m, sy + 0 * m, 1.5 * m, 14 * m);
    } else {
      // Short round cactus
      ctx.fillStyle = '#3a8a3a';
      ctx.beginPath(); ctx.ellipse(sx + 8 * m, sy + 8 * m, 4 * m, 5 * m, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a7a2a';
      ctx.beginPath(); ctx.ellipse(sx + 7 * m, sy + 8 * m, 3 * m, 4 * m, 0, 0, Math.PI * 2); ctx.fill();
      // Flower on top
      ctx.fillStyle = '#ff4488';
      ctx.beginPath(); ctx.arc(sx + 8 * m, sy + 3 * m, 1.5 * m, 0, Math.PI * 2); ctx.fill();
    }
  },
});

BiomeRegistry.add({
  id: 'desert',
  name: 'Desert',
  groundTile: T_SAND,
  heightRange: [0.35, 0.65],
  moistureRange: [0.0, 0.3],
  palette: { base: '#c4a44a', dark: '#aa8833', light: '#ddbb55', detail: '#b49440' },
  wallColor: '#8a7a5a',
  ambientColor: '#0a0804',
  ambientIntensity: 0.06,
  lightColor: '#ffeebb',
  enemies: ['scorpion', 'sand_snake', 'bandit'],
  density: { trees: 0.01, herbs: 0.01 },
});

// Cacti populate in desert — register with gathering skill
var _origGatherPopulate = SkillRegistry.get('gathering') ? SkillRegistry.get('gathering').populate : null;
if (_origGatherPopulate) {
  var gatherSkill = SkillRegistry.get('gathering');
  var origPop = gatherSkill.populate;
  gatherSkill.populate = function(tile, biome, wx, wy, rng) {
    // Desert cacti
    if (biome.id === 'desert' && tile.type !== T.WALL && tile.type !== T.WATER) {
      if (rng() < 0.04) {
        var cluster = overworldNoise(wx, wy, 66666, 0.12);
        if (cluster > 0.5) return T_CACTUS;
      }
    }
    return origPop ? origPop(tile, biome, wx, wy, rng) : null;
  };
}
