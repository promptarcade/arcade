
// ============================================================
// BIOME: Forest — dense trees, mushrooms, dark canopy
// ============================================================

var T_FOREST_FLOOR = TileRegistry.add({
  id: 102,
  name: 'forest_floor',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var hash = ((wx * 173 + wy * 311) & 0xffff);
    var tint = ((hash % 9) - 4) * 3;
    // Dark earthy ground
    ctx.fillStyle = shadeHex('#2a3a1a', tint);
    ctx.fillRect(sx, sy, ts, ts);
    // Fallen leaves
    if ((hash % 4) === 0) {
      ctx.fillStyle = '#4a3a1a';
      ctx.fillRect(sx + (hash % 10 + 2) * m, sy + (hash % 8 + 3) * m, 2 * m, 1 * m);
    }
    if ((hash % 6) === 0) {
      ctx.fillStyle = '#5a4a20';
      ctx.fillRect(sx + ((hash >> 3) % 9 + 3) * m, sy + ((hash >> 5) % 7 + 5) * m, 1.5 * m, 1.5 * m);
    }
    // Twig
    if ((hash % 11) === 0) {
      ctx.strokeStyle = '#5a4a30';
      ctx.lineWidth = Math.max(0.5, m * 0.4);
      ctx.beginPath();
      ctx.moveTo(sx + 3 * m, sy + 10 * m);
      ctx.lineTo(sx + 11 * m, sy + 8 * m);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(sx + 0.5, sy + 0.5, ts - 1, ts - 1);
  },
});

BiomeRegistry.add({
  id: 'forest',
  name: 'Forest',
  groundTile: T_FOREST_FLOOR,
  heightRange: [0.4, 0.7],
  moistureRange: [0.5, 0.9],
  palette: { base: '#2a3a1a', dark: '#1a2a10', light: '#3a4a2a', detail: '#253515' },
  wallColor: '#3a2a1a',
  ambientColor: '#060a04',
  ambientIntensity: 0.06,
  lightColor: '#88cc66',
  enemies: ['wolf', 'spider', 'treant'],
  density: { trees: 0.25, herbs: 0.08 },
});
